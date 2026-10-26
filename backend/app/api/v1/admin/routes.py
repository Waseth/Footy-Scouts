from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ....extensions import db
from ....models import (User, Role, Scout, Institution, Player, Tournament,
                        MediaUpload, Subscription, Payment, AdminAction,
                        OrganizerPayout, TournamentTeam, Team)
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

    total_users         = User.query.count()
    total_players       = Player.query.count()
    total_scouts        = Scout.query.count()
    total_institutions  = Institution.query.count()
    pending_scouts      = Scout.query.filter_by(is_verified=False).count()
    pending_inst        = Institution.query.filter_by(is_verified=False).count()
    suspended_users     = User.query.filter_by(is_suspended=True).count()
    total_tournaments   = Tournament.query.count()
    pending_tournaments = Tournament.query.filter_by(is_approved=False).count()
    featured_players    = Player.query.filter_by(is_featured=True).count()

    premium_subs = Subscription.query.filter(
        Subscription.plan.in_(['MONTHLY', 'ANNUAL']),
        Subscription.status == 'ACTIVE',
    ).count()

    total_revenue = db.session.query(
        func.sum(Payment.amount)
    ).filter_by(status='COMPLETED').scalar() or 0

    # Payouts pending for admin action (used by /admin landing page)
    pending_payouts = OrganizerPayout.query.filter_by(
        status=OrganizerPayout.STATUS_PENDING
    ).count()

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
        'pending_payouts': pending_payouts,
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
    result = paginate_query(query, schema_fn=lambda u: {
        **u.to_dict(),
        'is_suspended': u.is_suspended,
    })
    return success_response(data=result)


@admin_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    data = user.to_dict()

    if user.has_player_capability() and user.player_profile:
        data['profile'] = user.player_profile.to_dict(include_contact=True)
    elif user.has_scout_capability() and user.scout_profile:
        data['profile'] = user.scout_profile.to_dict(public=False)
    elif user.has_institution_capability() and user.institution_profile:
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


# 🆕 Promote a user to ADMIN role. Requires explicit admin action.
@admin_bp.route('/users/<user_id>/promote', methods=['POST'])
@jwt_required()
@admin_required
def promote_user_to_admin(user_id):
    """
    Promote an existing user to the ADMIN role.
    Idempotent-ish: returns 409 if the user is already an admin.
    """
    admin = get_current_user()
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)
    if user.is_admin():
        return error_response("User is already an admin", 409)

    admin_role = Role.query.filter_by(name='ADMIN').first()
    if not admin_role:
        return error_response("ADMIN role missing from database", 500)

    old_role = user.role_name
    user.role_id = admin_role.id

    _log_action(
        admin.id, 'PROMOTE_TO_ADMIN', AdminAction.TARGET_USER,
        target_user_id=user_id,
        notes=f"Promoted from {old_role} to ADMIN",
    )
    db.session.commit()

    return success_response(
        message=f"{user.email} promoted to ADMIN.",
        data={'user': user.to_dict()},
    )


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
    query = MediaUpload.query.order_by(MediaUpload.created_at.desc())
    status = request.args.get('status')
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
    query = Payment.query.order_by(Payment.created_at.desc())

    status = request.args.get('status')
    method = request.args.get('method')
    purpose = request.args.get('purpose')
    if status:
        query = query.filter_by(status=status.upper())
    if method:
        query = query.filter_by(method=method.upper())
    if purpose:
        query = query.filter_by(purpose=purpose.upper())

    result = paginate_query(query, schema_fn=lambda p: p.to_dict())
    return success_response(data=result)


# ─────────────────────────────────────────────────────────────
#  ORGANIZER PAYOUTS — manual admin settlement
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/payouts', methods=['GET'])
@jwt_required()
@admin_required
def list_payouts():
    """List organizer payouts. Filter by status."""
    query = OrganizerPayout.query.order_by(OrganizerPayout.created_at.desc())
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status.upper())
    result = paginate_query(query, schema_fn=lambda p: p.to_dict())
    return success_response(data=result)


@admin_bp.route('/payouts/<payout_id>/mark-paid', methods=['POST'])
@jwt_required()
@admin_required
def mark_payout_paid(payout_id):
    admin = get_current_user()
    payout = OrganizerPayout.query.get(payout_id)
    if not payout:
        return error_response("Payout not found", 404)

    if payout.status == OrganizerPayout.STATUS_PAID:
        return error_response("Payout is already marked PAID", 409)

    if payout.status not in (OrganizerPayout.STATUS_PENDING, OrganizerPayout.STATUS_FAILED):
        return error_response(
            f"Cannot mark {payout.status} payout as PAID", 400,
        )

    data = request.get_json() or {}
    method = (data.get('payment_method') or '').upper()
    reference = (data.get('transaction_reference') or '').strip()
    notes = (data.get('notes') or '').strip() or None

    if method not in (OrganizerPayout.METHOD_BANK, OrganizerPayout.METHOD_MPESA):
        return error_response("payment_method must be BANK or MPESA", 400)
    if not reference:
        return error_response("transaction_reference is required", 400)

    payout.status = OrganizerPayout.STATUS_PAID
    payout.payment_method = method
    payout.transaction_reference = reference
    payout.paid_by_admin_id = admin.id
    payout.paid_at = datetime.now(timezone.utc)
    if notes:
        payout.notes = notes

    tournament = payout.tournament
    if tournament:
        tournament.payout_status = 'PAID'
        tournament.paid_out_at = payout.paid_at

    _log_action(
        admin.id, 'MARK_PAYOUT_PAID', 'TOURNAMENT',
        target_object_id=payout.tournament_id,
        notes=f"payout={payout.id} method={method} ref={reference}",
    )
    db.session.commit()

    if tournament:
        try:
            NotificationService.create(
                user_id=tournament.organizer_user_id,
                title="Payout sent",
                body=(
                    f"Your payout for {tournament.tournament_name} "
                    f"({tournament.fee_currency} {float(payout.net_to_organizer):,.2f}) "
                    f"has been sent via {method}."
                ),
                notification_type="TOURNAMENT",
                related_id=tournament.id,
                related_type="Tournament",
            )
        except Exception:
            pass

    return success_response(data={'payout': payout.to_dict()},
                            message=f"Payout marked PAID via {method}.")


@admin_bp.route('/payouts/<payout_id>/mark-failed', methods=['POST'])
@jwt_required()
@admin_required
def mark_payout_failed(payout_id):
    admin = get_current_user()
    payout = OrganizerPayout.query.get(payout_id)
    if not payout:
        return error_response("Payout not found", 404)
    if payout.status == OrganizerPayout.STATUS_PAID:
        return error_response("Cannot mark a PAID payout as FAILED", 409)

    data = request.get_json() or {}
    notes = (data.get('notes') or '').strip() or "Marked FAILED by admin"

    payout.status = OrganizerPayout.STATUS_FAILED
    payout.notes = notes

    _log_action(
        admin.id, 'MARK_PAYOUT_FAILED', 'TOURNAMENT',
        target_object_id=payout.tournament_id,
        notes=f"payout={payout.id}: {notes}",
    )
    db.session.commit()
    return success_response(data={'payout': payout.to_dict()},
                            message="Payout marked FAILED.")


# ─────────────────────────────────────────────────────────────
#  REFUNDS — manual, admin-triggered
# ─────────────────────────────────────────────────────────────

@admin_bp.route('/payments/<payment_id>/refund', methods=['POST'])
@jwt_required()
@admin_required
def refund_payment(payment_id):
    admin = get_current_user()
    payment = Payment.query.get(payment_id)
    if not payment:
        return error_response("Payment not found", 404)
    if payment.status != Payment.STATUS_COMPLETED:
        return error_response(
            f"Only COMPLETED payments can be refunded (current: {payment.status})",
            400,
        )

    data = request.get_json() or {}
    reason = (data.get('reason') or '').strip() or "Refunded by admin"
    reference = (data.get('transaction_reference') or '').strip() or None

    payment.status = Payment.STATUS_REFUNDED
    payment.failure_reason = None
    if reference:
        payment.notes = (payment.notes or "") + f"\nRefund ref: {reference}"

    if (payment.purpose == Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY
            and payment.team_id and payment.tournament_id):
        entry = TournamentTeam.query.filter_by(
            tournament_id=payment.tournament_id,
            team_id=payment.team_id,
        ).first()
        if entry and entry.status == TournamentTeam.STATUS_REGISTERED:
            entry.status = TournamentTeam.STATUS_WITHDRAWN
            entry.registered_at = None

        tournament = db.session.get(Tournament, payment.tournament_id)
        if tournament and tournament.status == Tournament.ST_ALL_TEAMS_REGISTERED:
            tournament.status = Tournament.ST_FILLING_TEAMS

    _log_action(
        admin.id, 'REFUND_PAYMENT', 'PAYMENT',
        target_user_id=payment.user_id,
        target_object_id=payment.id,
        reason=reason,
        notes=f"ref={reference}" if reference else None,
    )
    db.session.commit()

    if payment.purpose == Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY and payment.team_id:
        team = db.session.get(Team, payment.team_id)
        tournament = db.session.get(Tournament, payment.tournament_id) if payment.tournament_id else None
        if team and tournament and payment.user_id:
            try:
                NotificationService.notify_tournament_refunded(
                    captain_user_id=payment.user_id,
                    team_name=team.name,
                    tournament_name=tournament.tournament_name,
                    amount=float(payment.amount),
                    currency=payment.currency,
                )
            except Exception:
                pass

    return success_response(data={'payment': payment.to_dict()},
                            message="Payment marked REFUNDED.")