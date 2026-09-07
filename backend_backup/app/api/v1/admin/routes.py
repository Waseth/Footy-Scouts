from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ....extensions import db
from ....models import (User, Role, Scout, Institution, Player, Tournament,
                        MediaUpload, Subscription, Payment, AdminAction)
from ....services.email_service import EmailService
from ....services.notification_service import NotificationService
from ....utils.decorators import admin_required, get_current_user
from ....utils.helpers import success_response, error_response, get_subscription_end_date
from ....utils.pagination import paginate_query

admin_bp = Blueprint('admin', __name__)


def _log_action(admin_id, action, target_type, target_user_id=None,
                target_object_id=None, reason=None, notes=None):
    """Helper: log admin action and flush (caller commits)."""
    AdminAction.log(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_user_id=target_user_id,
        target_object_id=target_object_id,
        reason=reason,
        notes=notes,
    )


# ─────────────────────────────────────────────────────────────
#  DASHBOARD STATS
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def dashboard():
    """Platform-wide statistics for the admin dashboard."""
    from sqlalchemy import func

    total_users        = User.query.count()
    total_players      = Player.query.count()
    total_scouts       = Scout.query.count()
    total_institutions = Institution.query.count()
    pending_scouts     = Scout.query.filter_by(is_verified=False).count()
    pending_inst       = Institution.query.filter_by(is_verified=False).count()
    suspended_users    = User.query.filter_by(is_suspended=True).count()
    total_tournaments  = Tournament.query.count()
    pending_tournaments= Tournament.query.filter_by(is_approved=False).count()
    featured_players   = Player.query.filter_by(is_featured=True).count()

    premium_subs = Subscription.query.filter(
        Subscription.plan.in_(['MONTHLY', 'ANNUAL']),
        Subscription.status == 'ACTIVE',
    ).count()

    total_revenue = db.session.query(
        func.sum(Payment.amount)
    ).filter_by(status='COMPLETED').scalar() or 0

    return success_response(data={
        'users': {
            'total': total_users,
            'players': total_players,
            'scouts': total_scouts,
            'institutions': total_institutions,
            'suspended': suspended_users,
        },
        'pending_approvals': {
            'scouts': pending_scouts,
            'institutions': pending_inst,
            'tournaments': pending_tournaments,
        },
        'subscriptions': {
            'premium': premium_subs,
        },
        'featured_players': featured_players,
        'tournaments': total_tournaments,
        'total_revenue_kes': float(total_revenue),
    })


# ─────────────────────────────────────────────────────────────
#  USER MANAGEMENT
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def list_users():
    query = User.query

    role = request.args.get('role')
    status = request.args.get('status')   # active | suspended | inactive
    search = request.args.get('search')

    if role:
        role_obj = Role.query.filter_by(name=role.upper()).first()
        if role_obj:
            query = query.filter_by(role_id=role_obj.id)
    if status == 'suspended':
        query = query.filter_by(is_suspended=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)
    elif status == 'active':
        query = query.filter_by(is_active=True, is_suspended=False)
    if search:
        query = query.filter(User.email.ilike(f'%{search}%'))

    query = query.order_by(User.created_at.desc())
    result = paginate_query(query)
    return success_response(data=result)


@admin_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    data = user.to_dict()

    if user.is_player() and user.player_profile:
        data['profile'] = user.player_profile.to_dict(include_contact=True)
    elif user.is_scout() and user.scout_profile:
        data['profile'] = user.scout_profile.to_dict(public=False)
    elif user.is_institution() and user.institution_profile:
        data['profile'] = user.institution_profile.to_dict(public=False)

    return success_response(data={'user': data})


@admin_bp.route('/users/<user_id>/suspend', methods=['POST'])
@jwt_required()
@admin_required
def suspend_user(user_id):
    admin = get_current_user()
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)
    if user.is_admin():
        return error_response("Cannot suspend another admin", 403)

    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    user.is_suspended = True
    _log_action(admin.id, AdminAction.SUSPEND_USER, AdminAction.TARGET_USER,
                target_user_id=user_id, reason=reason)
    db.session.commit()

    NotificationService.notify_account_suspended(user_id, reason)
    EmailService.send_account_suspended_email(user.email, reason)
    return success_response(message=f"User {user.email} suspended.")


@admin_bp.route('/users/<user_id>/unsuspend', methods=['POST'])
@jwt_required()
@admin_required
def unsuspend_user(user_id):
    admin = get_current_user()
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    user.is_suspended = False
    _log_action(admin.id, AdminAction.UNSUSPEND_USER, AdminAction.TARGET_USER,
                target_user_id=user_id)
    db.session.commit()
    return success_response(message=f"User {user.email} unsuspended.")


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    admin = get_current_user()
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)
    if user.is_admin():
        return error_response("Cannot delete an admin account", 403)

    data = request.get_json() or {}
    reason = data.get('reason', 'Account removed by admin')

    _log_action(admin.id, AdminAction.DELETE_USER, AdminAction.TARGET_USER,
                target_user_id=user_id, reason=reason)
    db.session.delete(user)
    db.session.commit()
    return success_response(message="User deleted.")


# ─────────────────────────────────────────────────────────────
#  SCOUT VERIFICATION
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/scouts/pending', methods=['GET'])
@jwt_required()
@admin_required
def pending_scouts():
    query = Scout.query.filter_by(is_verified=False).order_by(Scout.created_at.asc())
    result = paginate_query(query, schema_fn=lambda s: s.to_dict(public=False))
    return success_response(data=result)


@admin_bp.route('/scouts/<scout_id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_scout(scout_id):
    admin = get_current_user()
    scout = Scout.query.get(scout_id)
    if not scout:
        return error_response("Scout not found", 404)

    scout.is_verified = True
    scout.verified_at = datetime.now(timezone.utc)
    scout.verified_by = admin.id
    scout.user.is_approved = True

    _log_action(admin.id, AdminAction.APPROVE_SCOUT, AdminAction.TARGET_SCOUT,
                target_user_id=scout.user_id, target_object_id=scout_id)
    db.session.commit()

    NotificationService.notify_account_approved(scout.user_id, 'Scout')
    EmailService.send_account_approved_email(scout.user.email, 'Scout')
    return success_response(message=f"Scout '{scout.scout_name}' approved and profile is now public.")


@admin_bp.route('/scouts/<scout_id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def reject_scout(scout_id):
    admin = get_current_user()
    scout = Scout.query.get(scout_id)
    if not scout:
        return error_response("Scout not found", 404)

    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    _log_action(admin.id, AdminAction.REJECT_SCOUT, AdminAction.TARGET_SCOUT,
                target_user_id=scout.user_id, target_object_id=scout_id, reason=reason)
    db.session.commit()
    return success_response(message="Scout rejected.")


# ─────────────────────────────────────────────────────────────
#  INSTITUTION VERIFICATION
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/institutions/pending', methods=['GET'])
@jwt_required()
@admin_required
def pending_institutions():
    query = Institution.query.filter_by(is_verified=False).order_by(Institution.created_at.asc())
    result = paginate_query(query, schema_fn=lambda i: i.to_dict(public=False))
    return success_response(data=result)


@admin_bp.route('/institutions/<institution_id>/verify', methods=['POST'])
@jwt_required()
@admin_required
def verify_institution(institution_id):
    admin = get_current_user()
    institution = Institution.query.get(institution_id)
    if not institution:
        return error_response("Institution not found", 404)

    institution.is_verified = True
    institution.verified_at = datetime.now(timezone.utc)
    institution.verified_by = admin.id
    institution.user.is_approved = True

    _log_action(admin.id, AdminAction.VERIFY_INSTITUTION, AdminAction.TARGET_INSTITUTION,
                target_user_id=institution.user_id, target_object_id=institution_id)
    db.session.commit()

    NotificationService.notify_account_approved(institution.user_id, 'Institution')
    EmailService.send_account_approved_email(institution.user.email, 'Institution')
    return success_response(message=f"Institution '{institution.institution_name}' verified.")


@admin_bp.route('/institutions/<institution_id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def reject_institution(institution_id):
    admin = get_current_user()
    institution = Institution.query.get(institution_id)
    if not institution:
        return error_response("Institution not found", 404)

    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    _log_action(admin.id, AdminAction.REJECT_INSTITUTION, AdminAction.TARGET_INSTITUTION,
                target_user_id=institution.user_id, target_object_id=institution_id, reason=reason)
    db.session.commit()
    return success_response(message="Institution rejected.")


# ─────────────────────────────────────────────────────────────
#  PLAYER MANAGEMENT
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/players/<player_id>/feature', methods=['POST'])
@jwt_required()
@admin_required
def feature_player(player_id):
    admin = get_current_user()
    player = Player.query.get(player_id)
    if not player:
        return error_response("Player not found", 404)
    player.is_featured = True
    _log_action(admin.id, AdminAction.FEATURE_PLAYER, AdminAction.TARGET_USER,
                target_user_id=player.user_id, target_object_id=player_id)
    db.session.commit()
    return success_response(message="Player featured.")


@admin_bp.route('/players/<player_id>/unfeature', methods=['POST'])
@jwt_required()
@admin_required
def unfeature_player(player_id):
    admin = get_current_user()
    player = Player.query.get(player_id)
    if not player:
        return error_response("Player not found", 404)
    player.is_featured = False
    _log_action(admin.id, AdminAction.UNFEATURE_PLAYER, AdminAction.TARGET_USER,
                target_user_id=player.user_id, target_object_id=player_id)
    db.session.commit()
    return success_response(message="Player unfeatured.")


# ─────────────────────────────────────────────────────────────
#  TOURNAMENT MANAGEMENT
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/tournaments/pending', methods=['GET'])
@jwt_required()
@admin_required
def pending_tournaments():
    query = Tournament.query.filter_by(is_approved=False).order_by(Tournament.created_at.asc())
    result = paginate_query(query)
    return success_response(data=result)


@admin_bp.route('/tournaments/<tournament_id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_tournament(tournament_id):
    admin = get_current_user()
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)
    tournament.is_approved = True
    _log_action(admin.id, AdminAction.APPROVE_TOURNAMENT, AdminAction.TARGET_TOURNAMENT,
                target_object_id=tournament_id)
    db.session.commit()
    return success_response(message="Tournament approved and now public.")


@admin_bp.route('/tournaments/<tournament_id>/cancel', methods=['POST'])
@jwt_required()
@admin_required
def cancel_tournament(tournament_id):
    admin = get_current_user()
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)
    tournament.status = Tournament.STATUS_CANCELLED
    tournament.is_approved = False
    data = request.get_json() or {}
    _log_action(admin.id, AdminAction.CANCEL_TOURNAMENT, AdminAction.TARGET_TOURNAMENT,
                target_object_id=tournament_id, reason=data.get('reason'))
    db.session.commit()
    return success_response(message="Tournament cancelled.")


# ─────────────────────────────────────────────────────────────
#  MEDIA MODERATION
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/media', methods=['GET'])
@jwt_required()
@admin_required
def list_media():
    """List all media uploads for moderation."""
    query = MediaUpload.query.order_by(MediaUpload.created_at.desc())
    status = request.args.get('status')  # approved | rejected
    if status == 'approved':
        query = query.filter_by(is_approved=True)
    elif status == 'rejected':
        query = query.filter_by(is_approved=False)
    result = paginate_query(query)
    return success_response(data=result)


@admin_bp.route('/media/<media_id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def reject_media(media_id):
    admin = get_current_user()
    media = MediaUpload.query.get(media_id)
    if not media:
        return error_response("Media not found", 404)
    data = request.get_json() or {}
    note = data.get('note', '')
    media.is_approved = False
    media.moderation_note = note
    _log_action(admin.id, AdminAction.REJECT_MEDIA, AdminAction.TARGET_MEDIA,
                target_user_id=media.user_id, target_object_id=media_id, reason=note)
    db.session.commit()
    return success_response(message="Media rejected.")


@admin_bp.route('/media/<media_id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_media(media_id):
    admin = get_current_user()
    media = MediaUpload.query.get(media_id)
    if not media:
        return error_response("Media not found", 404)
    media.is_approved = True
    media.moderation_note = None
    _log_action(admin.id, AdminAction.APPROVE_MEDIA, AdminAction.TARGET_MEDIA,
                target_user_id=media.user_id, target_object_id=media_id)
    db.session.commit()
    return success_response(message="Media approved.")


# ─────────────────────────────────────────────────────────────
#  SUBSCRIPTION MANAGEMENT
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/subscriptions', methods=['GET'])
@jwt_required()
@admin_required
def list_subscriptions():
    query = Subscription.query.order_by(Subscription.created_at.desc())
    plan = request.args.get('plan')
    status = request.args.get('status')
    if plan:
        query = query.filter_by(plan=plan.upper())
    if status:
        query = query.filter_by(status=status.upper())
    result = paginate_query(query)
    return success_response(data=result)


@admin_bp.route('/subscriptions/<user_id>/grant', methods=['POST'])
@jwt_required()
@admin_required
def grant_subscription(user_id):
    """Manually grant a premium subscription to a user."""
    admin = get_current_user()
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    plan = data.get('plan', 'MONTHLY').upper()
    if plan not in ['MONTHLY', 'ANNUAL']:
        return error_response("plan must be MONTHLY or ANNUAL", 400)

    sub = user.subscription
    if not sub:
        sub = Subscription(user_id=user_id)
        db.session.add(sub)

    sub.plan = plan
    sub.status = Subscription.STATUS_ACTIVE
    sub.start_date = datetime.now(timezone.utc)
    sub.end_date = get_subscription_end_date(plan)

    _log_action(admin.id, AdminAction.GRANT_SUBSCRIPTION, AdminAction.TARGET_SUBSCRIPTION,
                target_user_id=user_id, notes=f"Admin granted {plan} subscription")
    db.session.commit()

    NotificationService.notify_subscription_activated(user_id, plan)
    return success_response(message=f"{plan} subscription granted to {user.email}.")


# ─────────────────────────────────────────────────────────────
#  AUDIT LOG
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/audit-log', methods=['GET'])
@jwt_required()
@admin_required
def audit_log():
    """View the full admin action audit log."""
    query = AdminAction.query.order_by(AdminAction.created_at.desc())

    action_filter = request.args.get('action')
    target_type   = request.args.get('target_type')
    admin_id      = request.args.get('admin_id')

    if action_filter:
        query = query.filter_by(action=action_filter)
    if target_type:
        query = query.filter_by(target_type=target_type.upper())
    if admin_id:
        query = query.filter_by(admin_id=admin_id)

    result = paginate_query(query)
    return success_response(data=result)


# ─────────────────────────────────────────────────────────────
#  PAYMENTS OVERVIEW
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/payments', methods=['GET'])
@jwt_required()
@admin_required
def list_payments():
    from ....models import Payment
    query = Payment.query.order_by(Payment.created_at.desc())

    status = request.args.get('status')
    method = request.args.get('method')
    if status:
        query = query.filter_by(status=status.upper())
    if method:
        query = query.filter_by(method=method.upper())

    result = paginate_query(query)
    return success_response(data=result)