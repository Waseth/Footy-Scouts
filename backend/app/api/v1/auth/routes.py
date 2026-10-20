from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from ....services.auth_service import AuthService
from ....utils.validators import validate_email, validate_password
from ....utils.helpers import success_response, error_response
from ....utils.decorators import get_current_user
from ....extensions import db, limiter
from ....models import Role

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per hour")
def register():
    """Register a new user. Role: PLAYER, SCOUT, or INSTITUTION."""
    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role_name = data.get('role', 'PLAYER').upper()

    if not email or not password:
        return error_response("Email and password are required", 400)
    if not validate_email(email):
        return error_response("Invalid email address", 400)

    valid_pw, pw_msg = validate_password(password)
    if not valid_pw:
        return error_response(pw_msg, 400)

    valid_roles = [Role.PLAYER, Role.SCOUT, Role.INSTITUTION]
    if role_name not in valid_roles:
        return error_response(f"Invalid role. Choose from: {', '.join(valid_roles)}", 400)

    result, status = AuthService.register_user(email, password, role_name)
    if 'error' in result:
        return error_response(result['error'], status)

    user = result['user']
    user.is_verified = True
    db.session.commit()

    approval_msg = ""
    if role_name in [Role.SCOUT, Role.INSTITUTION]:
        approval_msg = " Your account is pending admin approval before your profile goes public."

    return success_response(
        data={
            'user': user.to_dict(),
            'access_token': result['access_token'],
            'refresh_token': result['refresh_token'],
            'message': f'Registration successful.{approval_msg}',
        },
        status_code=201,
    )


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("20 per hour")
def login():
    """Login with email and password."""
    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return error_response("Email and password are required", 400)

    result, status = AuthService.login_user(email, password)
    if 'error' in result:
        return error_response(result['error'], status)

    return success_response(data=result, status_code=200)


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Revoke the current access token."""
    jti = get_jwt()['jti']
    result, status = AuthService.logout_user(jti)
    return success_response(message=result['message'], status_code=status)


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Get a new access token using a refresh token."""
    user_id = get_jwt_identity()
    result, status = AuthService.refresh_access_token(user_id)
    if 'error' in result:
        return error_response(result['error'], status)
    return success_response(data=result, status_code=status)


@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("5 per hour")
def forgot_password():
    """Request a password reset email."""
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    if not email or not validate_email(email):
        return error_response("Valid email required", 400)

    result, status = AuthService.request_password_reset(email)
    return success_response(message=result['message'], status_code=200)


@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("5 per hour")
def reset_password():
    """Reset password using token from email."""
    data = request.get_json()
    token = data.get('token', '')
    new_password = data.get('new_password', '')

    if not token or not new_password:
        return error_response("Token and new password are required", 400)

    valid_pw, pw_msg = validate_password(new_password)
    if not valid_pw:
        return error_response(pw_msg, 400)

    result, status = AuthService.reset_password(token, new_password)
    if 'error' in result:
        return error_response(result['error'], status)

    return success_response(message=result['message'], status_code=status)


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user_info():
    """Get current authenticated user's basic info."""
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)
    return success_response(data={'user': user.to_dict()})


# 🆕 Delete account — requires password confirmation
@auth_bp.route('/account', methods=['DELETE'])
@jwt_required()
@limiter.limit("3 per hour")
def delete_account():
    """
    Permanently delete the current user's account.

    Requires password confirmation in the request body:
        { "password": "..." }

    Cascades:
      - Player / Scout / Institution profiles deleted
      - Subscription deleted
      - Media uploads deleted (Cloudinary files NOT auto-deleted)
      - Team memberships removed
      - Tournament participations removed
      - Notifications deleted
      - Payments: user_id set to NULL (kept for accounting)

    Preserved:
      - Team captaincy → transfer needed before delete (we block if captain of
        any team with active tournament entries)
      - Tournament organizer records → blocked if organizer has active tournaments
    """
    from ....models import Team, Tournament, TournamentTeam

    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    password = data.get('password', '')

    if not password:
        return error_response(
            "Password is required to delete your account",
            400,
            errors={'code': 'PASSWORD_REQUIRED'},
        )

    if not user.check_password(password):
        return error_response(
            "Incorrect password",
            401,
            errors={'code': 'INVALID_PASSWORD'},
        )

    # ── Safety checks ──

    # 1. Block if they captain a team with active tournament entries
    captained = Team.query.filter_by(captain_user_id=user.id).all()
    for team in captained:
        active_entry = TournamentTeam.query.filter(
            TournamentTeam.team_id == team.id,
            TournamentTeam.status.in_([
                TournamentTeam.STATUS_INVITED,
                TournamentTeam.STATUS_JOIN_REQUESTED,
                TournamentTeam.STATUS_ACCEPTED,
                TournamentTeam.STATUS_REGISTERED,
            ]),
        ).first()
        if active_entry:
            return error_response(
                f"You are the captain of {team.name}, which is currently in a tournament. "
                "Transfer captaincy or withdraw the team before deleting your account.",
                400,
                errors={'code': 'CAPTAIN_OF_ACTIVE_TEAM'},
            )

    # 2. Block if they organize any active tournament
    active_tournament = Tournament.query.filter(
        Tournament.organizer_user_id == user.id,
        Tournament.status.in_([
            'DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN',
            'FILLING_TEAMS', 'ALL_TEAMS_REGISTERED',
            'REGISTRATION_CLOSED', 'IN_PROGRESS',
        ]),
    ).first()
    if active_tournament:
        return error_response(
            f"You are organizing '{active_tournament.tournament_name}', which is "
            "still active. Complete or cancel it before deleting your account.",
            400,
            errors={'code': 'ORGANIZING_ACTIVE_TOURNAMENT'},
        )

    # ── Deletion ──
    try:
        from ....models import (
            Subscription, Player, Scout, Institution, OrganizerProfile,
            MediaUpload, Notification, TeamMember, PlayerInvitation,
            PlayerJoinRequest, Conversation, Message, Payment,
        )

        # Delete media uploads (Cloudinary files remain — you may want to
        # batch-delete later via admin tool)
        MediaUpload.query.filter_by(user_id=user.id).delete()

        # Delete notifications
        Notification.query.filter_by(user_id=user.id).delete()

        # Remove team memberships
        TeamMember.query.filter_by(user_id=user.id).delete()

        # Cancel any pending player invitations
        PlayerInvitation.query.filter(
            (PlayerInvitation.invited_user_id == user.id) |
            (PlayerInvitation.invited_by_user_id == user.id)
        ).delete(synchronize_session=False)

        # Cancel any pending player join requests
        PlayerJoinRequest.query.filter_by(user_id=user.id).delete()

        # Delete conversations + messages (both directions)
        Message.query.filter(
            (Message.sender_id == user.id) |
            (Message.recipient_id == user.id)
        ).delete(synchronize_session=False)

        # Preserve payment records but unlink user
        Payment.query.filter_by(user_id=user.id).update(
            {'user_id': None}, synchronize_session=False
        )

        # Delete profiles (subscription cascades via FK, but be explicit)
        if user.player_profile:
            db.session.delete(user.player_profile)
        if user.scout_profile:
            db.session.delete(user.scout_profile)
        if getattr(user, 'institution_profile', None):
            db.session.delete(user.institution_profile)
        if getattr(user, 'organizer_profile', None):
            db.session.delete(user.organizer_profile)
        if user.subscription:
            db.session.delete(user.subscription)

        # Delete the user
        db.session.delete(user)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return error_response(f"Could not delete account: {str(e)}", 500)

    return success_response(
        message="Your account has been permanently deleted.",
    )