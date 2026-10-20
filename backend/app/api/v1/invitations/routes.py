from datetime import datetime, timezone

from flask import Blueprint
from flask_jwt_extended import jwt_required

from ....extensions import db
from ....models import (
    PlayerInvitation, PlayerJoinRequest, TeamMember, Team, Player,
)
from ....services.notification_service import NotificationService
from ....utils.decorators import get_current_user
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query

invitations_bp = Blueprint('invitations', __name__)


# ─────────────────────────────────────────────────────────────
#  Player — invitations received (captain invited me)
# ─────────────────────────────────────────────────────────────

@invitations_bp.route('/player', methods=['GET'])
@jwt_required()
def my_player_invitations():
    """List pending invitations to join teams."""
    user = get_current_user()
    query = PlayerInvitation.query.filter_by(
        invited_user_id=user.id,
        status=PlayerInvitation.STATUS_PENDING,
    ).order_by(PlayerInvitation.created_at.desc())
    result = paginate_query(query, schema_fn=lambda i: i.to_dict())
    return success_response(data=result)


@invitations_bp.route('/player/<invite_id>/accept', methods=['POST'])
@jwt_required()
def accept_player_invite(invite_id):
    user = get_current_user()
    invite = PlayerInvitation.query.filter_by(
        id=invite_id,
        invited_user_id=user.id,
        status=PlayerInvitation.STATUS_PENDING,
    ).first()
    if not invite:
        return error_response("Invitation not found", 404)

    if not user.player_profile:
        return error_response(
            "You must have a player profile to join a team",
            403,
            errors={'code': 'PLAYER_PROFILE_REQUIRED'},
        )

    team = db.session.get(Team, invite.team_id)
    if not team:
        return error_response("Team no longer exists", 404)

    # Already a member?
    existing = TeamMember.query.filter_by(
        team_id=team.id, user_id=user.id, status=TeamMember.STATUS_ACTIVE,
    ).first()
    if existing:
        invite.status = PlayerInvitation.STATUS_ACCEPTED
        invite.responded_at = datetime.now(timezone.utc)
        db.session.commit()
        return error_response("You're already on this team", 409)

    # Add member
    db.session.add(TeamMember(
        team_id=team.id,
        user_id=user.id,
        status=TeamMember.STATUS_ACTIVE,
    ))
    invite.status = PlayerInvitation.STATUS_ACCEPTED
    invite.responded_at = datetime.now(timezone.utc)
    db.session.commit()

    try:
        player_name = user.player_profile.full_name if user.player_profile else user.email
        NotificationService.notify_invite_accepted(
            captain_user_id=team.captain_user_id,
            player_name=player_name,
            team_name=team.name,
            team_id=team.id,
        )
    except Exception:
        pass

    return success_response(message=f"You've joined {team.name}")


@invitations_bp.route('/player/<invite_id>/reject', methods=['POST'])
@jwt_required()
def reject_player_invite(invite_id):
    user = get_current_user()
    invite = PlayerInvitation.query.filter_by(
        id=invite_id,
        invited_user_id=user.id,
        status=PlayerInvitation.STATUS_PENDING,
    ).first()
    if not invite:
        return error_response("Invitation not found", 404)

    team = db.session.get(Team, invite.team_id)

    invite.status = PlayerInvitation.STATUS_REJECTED
    invite.responded_at = datetime.now(timezone.utc)
    db.session.commit()

    if team:
        try:
            player_name = user.player_profile.full_name if user.player_profile else user.email
            NotificationService.notify_invite_rejected(
                captain_user_id=team.captain_user_id,
                player_name=player_name,
                team_name=team.name,
                team_id=team.id,
            )
        except Exception:
            pass

    return success_response(message="Invitation declined")


# ─────────────────────────────────────────────────────────────
#  Player — my join requests (I requested to join a team)
# ─────────────────────────────────────────────────────────────

@invitations_bp.route('/my-join-requests', methods=['GET'])
@jwt_required()
def my_join_requests():
    user = get_current_user()
    query = PlayerJoinRequest.query.filter_by(user_id=user.id).order_by(
        PlayerJoinRequest.created_at.desc()
    )
    result = paginate_query(query, schema_fn=lambda r: r.to_dict())
    return success_response(data=result)


@invitations_bp.route('/my-join-requests/<request_id>', methods=['DELETE'])
@jwt_required()
def cancel_join_request(request_id):
    user = get_current_user()
    req = PlayerJoinRequest.query.filter_by(
        id=request_id,
        user_id=user.id,
        status=PlayerJoinRequest.STATUS_PENDING,
    ).first()
    if not req:
        return error_response("Request not found", 404)

    req.status = PlayerJoinRequest.STATUS_CANCELLED
    req.responded_at = datetime.now(timezone.utc)
    db.session.commit()
    return success_response(message="Request cancelled")