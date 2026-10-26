import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import (
    Payment, Subscription, User,
    Tournament, TournamentTeam, Team, TeamMember,
)
from ....services.paystack_service import PaystackService
from ....services.notification_service import NotificationService
from ....utils.decorators import get_current_user
from ....utils.helpers import success_response, error_response, get_subscription_end_date

payments_bp = Blueprint('payments', __name__)


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def _make_reference(purpose: str) -> str:
    return f"FS-{purpose[:4]}-{uuid.uuid4().hex[:10].upper()}"


def _price_for_plan(plan: str) -> float:
    if plan == 'MONTHLY':
        return current_app.config['MONTHLY_PRICE_KES']
    if plan == 'ANNUAL':
        return current_app.config['ANNUAL_PRICE_KES']
    raise ValueError("Unsupported plan")


# ─── Subscription activation ────────────────────────────────

def _activate_subscription(user: User, plan: str, payment: Payment):
    """Upgrade or create a subscription after successful payment. Idempotent."""
    sub = user.subscription
    if not sub:
        sub = Subscription(user_id=user.id)
        db.session.add(sub)

    sub.plan = plan
    sub.status = Subscription.STATUS_ACTIVE
    sub.start_date = datetime.now(timezone.utc)
    sub.end_date = get_subscription_end_date(plan)
    sub.renewal_date = sub.end_date
    sub.auto_renew = False

    payment.subscription_id = sub.id
    db.session.commit()

    try:
        NotificationService.notify_subscription_activated(user.id, plan)
    except Exception:
        pass

    return sub


# ─── Tournament entry activation ────────────────────────────

def _activate_tournament_entry(payment: Payment):
    """
    Called after a TEAM_TOURNAMENT_ENTRY payment is verified as COMPLETED.
    Promotes the TournamentTeam ACCEPTED → REGISTERED and, if that fills the
    tournament, transitions the tournament to ALL_TEAMS_REGISTERED.

    Idempotent: a second call for the same payment is a no-op.
    """
    if not payment.team_id or not payment.tournament_id:
        return  # malformed payment — nothing to activate

    entry = TournamentTeam.query.filter_by(
        tournament_id=payment.tournament_id,
        team_id=payment.team_id,
    ).first()

    if not entry:
        # Entry was deleted between init and verify — don't crash.
        return

    # Already linked to this payment — idempotent exit
    if entry.status == TournamentTeam.STATUS_REGISTERED and entry.entry_payment_id == payment.id:
        return

    if entry.status not in (TournamentTeam.STATUS_ACCEPTED,):
        # Wrong state (e.g. rejected/withdrawn) — record but don't promote.
        # Admin can refund from the payments list.
        return

    entry.status = TournamentTeam.STATUS_REGISTERED
    entry.entry_payment_id = payment.id
    entry.registered_at = datetime.now(timezone.utc)

    tournament = db.session.get(Tournament, payment.tournament_id)
    if tournament:
        if tournament.registered_teams_count() >= tournament.required_teams:
            tournament.status = Tournament.ST_ALL_TEAMS_REGISTERED

    db.session.commit()

    try:
        captain_id = entry.team.captain_user_id if entry.team else payment.user_id
        NotificationService.notify_tournament_entry_paid(
            captain_user_id=captain_id,
            team_name=entry.team.name if entry.team else "your team",
            tournament_name=tournament.tournament_name if tournament else "the tournament",
            tournament_id=payment.tournament_id,
            organizer_user_id=tournament.organizer_user_id if tournament else captain_id,
        )
    except Exception:
        pass


# ─── Shared finalize: called from BOTH verify and webhook ──

def _finalize_payment(payment: Payment, raw_payload: dict | None = None,
                      channel: str | None = None,
                      transaction_id: str | None = None) -> None:
    """
    Mark payment COMPLETED and dispatch by purpose.

    Callers are responsible for: amount-mismatch checks, status checks,
    and idempotency (early-return when payment.status == COMPLETED).
    """
    payment.status = Payment.STATUS_COMPLETED
    if transaction_id:
        payment.transaction_id = transaction_id
    if channel:
        payment.paystack_channel = channel
    payment.completed_at = datetime.now(timezone.utc)
    if raw_payload is not None:
        payment.raw_response = json.dumps(raw_payload)
    db.session.commit()

    if payment.purpose == Payment.PURPOSE_SUBSCRIPTION and payment.plan:
        user = db.session.get(User, payment.user_id)
        if user:
            _activate_subscription(user, payment.plan, payment)

    elif payment.purpose == Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY:
        _activate_tournament_entry(payment)

    # Other purposes (TOURNAMENT_FINAL, OTHER) — no auto-action


# ─────────────────────────────────────────────────────────────
#  Initialize — SUBSCRIPTION
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/paystack/initialize', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def paystack_initialize():
    """
    Initialize a Paystack transaction for a subscription plan.
    Amount is derived from server-side config by `plan`.
    """
    user = get_current_user()
    data = request.get_json() or {}
    plan = (data.get('plan') or '').upper()

    if plan not in ('MONTHLY', 'ANNUAL'):
        return error_response("plan must be MONTHLY or ANNUAL", 400)

    try:
        amount = _price_for_plan(plan)
    except ValueError as e:
        return error_response(str(e), 400)

    reference = _make_reference('SUB')
    callback_url = current_app.config.get(
        'PAYSTACK_CALLBACK_URL',
        f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/paystack/callback",
    )

    payment = Payment(
        user_id=user.id,
        amount=amount,
        currency=Payment.CURRENCY_KES,
        method=Payment.METHOD_PAYSTACK,
        status=Payment.STATUS_PENDING,
        purpose=Payment.PURPOSE_SUBSCRIPTION,
        plan=plan,
        paystack_reference=reference,
        email=user.email,
    )
    db.session.add(payment)
    db.session.commit()

    result = PaystackService.initialize_transaction(
        email=user.email,
        amount=amount,
        reference=reference,
        callback_url=callback_url,
        metadata={
            'payment_id': payment.id,
            'user_id': user.id,
            'plan': plan,
            'purpose': 'SUBSCRIPTION',
        },
        channels=['card', 'mobile_money', 'bank'],
    )

    if not result.get('success'):
        payment.status = Payment.STATUS_FAILED
        payment.failure_reason = result.get('error')
        db.session.commit()
        return error_response(f"Paystack error: {result.get('error')}", 502)

    payment.paystack_access_code = result.get('access_code')
    payment.paystack_authorization_url = result.get('authorization_url')
    payment.raw_response = json.dumps(result.get('raw'))
    db.session.commit()

    return success_response(data={
        'payment_id': payment.id,
        'reference': payment.paystack_reference,
        'authorization_url': payment.paystack_authorization_url,
        'access_code': payment.paystack_access_code,
        'amount': float(payment.amount),
        'currency': payment.currency,
        'purpose': payment.purpose,
    })


# ─────────────────────────────────────────────────────────────
#  Initialize — TEAM TOURNAMENT ENTRY
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/paystack/initialize/team-entry', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def paystack_initialize_team_entry():
    """
    Initialize a Paystack transaction for a team's tournament entry fee.

    Rules:
      - Caller must be the team captain.
      - Entry must be in ACCEPTED status (organizer approved / invite accepted).
      - Squad size must be within [min_players_per_team, max_players_per_team].
      - Tournament must accept registration (REGISTRATION_OPEN / FILLING_TEAMS).
      - Tournament not yet full.
      - No existing PENDING or COMPLETED payment for this (team, tournament).
      - Amount = team_entry_fee + platform_fee_per_team (server-side, additive).
    """
    user = get_current_user()
    data = request.get_json() or {}
    team_id = data.get('team_id')
    tournament_id = data.get('tournament_id')

    if not team_id or not tournament_id:
        return error_response("team_id and tournament_id are required", 400)

    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    if team.captain_user_id != user.id:
        return error_response("Only the team captain can pay the entry fee", 403)

    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    if tournament.status not in (
        Tournament.ST_REGISTRATION_OPEN,
        Tournament.ST_FILLING_TEAMS,
    ):
        return error_response(
            "Registration is not open for this tournament", 400,
            errors={'code': 'NOT_OPEN'},
        )

    entry = TournamentTeam.query.filter_by(
        tournament_id=tournament.id, team_id=team.id,
    ).first()
    if not entry:
        return error_response(
            "Your team has no entry for this tournament", 404,
            errors={'code': 'NO_ENTRY'},
        )
    if entry.status == TournamentTeam.STATUS_REGISTERED:
        return error_response(
            "This team is already registered for the tournament", 409,
            errors={'code': 'ALREADY_REGISTERED'},
        )
    if entry.status != TournamentTeam.STATUS_ACCEPTED:
        return error_response(
            f"Your team is not yet accepted into this tournament (status: {entry.status})",
            400,
            errors={'code': 'NOT_ACCEPTED', 'status': entry.status},
        )

    # Squad size
    squad = team.active_members_count()
    if squad < tournament.min_players_per_team:
        return error_response(
            f"Your squad has {squad} player(s). This tournament requires at "
            f"least {tournament.min_players_per_team}.",
            400,
            errors={
                'code': 'TEAM_UNDERSTAFFED',
                'current': squad,
                'required': tournament.min_players_per_team,
            },
        )
    if squad > tournament.max_players_per_team:
        return error_response(
            f"Your squad has {squad} player(s). This tournament allows at most "
            f"{tournament.max_players_per_team}. Remove players before paying.",
            400,
            errors={
                'code': 'TEAM_OVERSTAFFED',
                'current': squad,
                'max': tournament.max_players_per_team,
            },
        )

    # Tournament capacity (accepted + registered)
    occupied = TournamentTeam.query.filter(
        TournamentTeam.tournament_id == tournament.id,
        TournamentTeam.status.in_([
            TournamentTeam.STATUS_ACCEPTED,
            TournamentTeam.STATUS_REGISTERED,
        ]),
    ).count()
    if occupied > tournament.required_teams:
        return error_response(
            "Tournament is already full", 400,
            errors={'code': 'TOURNAMENT_FULL'},
        )

    # No double-charge
    existing = Payment.query.filter(
        Payment.purpose == Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY,
        Payment.team_id == team.id,
        Payment.tournament_id == tournament.id,
        Payment.status.in_([Payment.STATUS_PENDING, Payment.STATUS_COMPLETED]),
    ).first()
    if existing:
        if existing.status == Payment.STATUS_COMPLETED:
            return error_response(
                "This team has already paid its entry fee for this tournament",
                409,
                errors={'code': 'ALREADY_PAID'},
            )
        return error_response(
            "A pending payment already exists. Complete it or wait for it to expire.",
            409,
            errors={
                'code': 'PAYMENT_IN_PROGRESS',
                'reference': existing.paystack_reference,
                'authorization_url': existing.paystack_authorization_url,
            },
        )

    # Amount (additive fee model)
    entry_fee = float(tournament.team_entry_fee or 0)
    platform_fee = float(tournament.platform_fee_per_team or 0)
    amount = round(entry_fee + platform_fee, 2)
    if amount <= 0:
        return error_response(
            "This tournament has no entry fee", 400,
            errors={'code': 'FREE_TOURNAMENT'},
        )

    reference = _make_reference('TENT')
    callback_url = current_app.config.get(
        'PAYSTACK_CALLBACK_URL',
        f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/paystack/callback",
    )

    payment = Payment(
        user_id=user.id,
        amount=amount,
        currency=Payment.CURRENCY_KES,
        method=Payment.METHOD_PAYSTACK,
        status=Payment.STATUS_PENDING,
        purpose=Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY,
        plan=None,
        paystack_reference=reference,
        email=user.email,
        team_id=team.id,
        tournament_id=tournament.id,
    )
    db.session.add(payment)
    db.session.commit()

    result = PaystackService.initialize_transaction(
        email=user.email,
        amount=amount,
        reference=reference,
        callback_url=callback_url,
        metadata={
            'payment_id': payment.id,
            'user_id': user.id,
            'team_id': team.id,
            'tournament_id': tournament.id,
            'purpose': 'TEAM_TOURNAMENT_ENTRY',
        },
        channels=['card', 'mobile_money', 'bank'],
    )

    if not result.get('success'):
        payment.status = Payment.STATUS_FAILED
        payment.failure_reason = result.get('error')
        db.session.commit()
        return error_response(f"Paystack error: {result.get('error')}", 502)

    payment.paystack_access_code = result.get('access_code')
    payment.paystack_authorization_url = result.get('authorization_url')
    payment.raw_response = json.dumps(result.get('raw'))
    db.session.commit()

    return success_response(data={
        'payment_id': payment.id,
        'reference': payment.paystack_reference,
        'authorization_url': payment.paystack_authorization_url,
        'access_code': payment.paystack_access_code,
        'amount': float(payment.amount),
        'currency': payment.currency,
        'purpose': payment.purpose,
        'team_id': team.id,
        'tournament_id': tournament.id,
        'fee_breakdown': {
            'team_entry_fee': entry_fee,
            'platform_fee': platform_fee,
            'total': amount,
        },
    })


# ─────────────────────────────────────────────────────────────
#  Verify
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/paystack/verify/<reference>', methods=['GET'])
@jwt_required()
def paystack_verify(reference):
    """Verify a Paystack transaction. Idempotent and purpose-aware."""
    user = get_current_user()
    payment = Payment.query.filter_by(
        paystack_reference=reference, user_id=user.id,
    ).first()
    if not payment:
        return error_response("Payment not found", 404)

    # Idempotent early exit
    if payment.status == Payment.STATUS_COMPLETED:
        return success_response(data={
            'payment': payment.to_dict(),
            'subscription': payment.subscription.to_dict() if payment.subscription else None,
        })

    result = PaystackService.verify_transaction(reference)
    if not result.get('success'):
        return error_response(f"Verification failed: {result.get('error')}", 502)

    status = result.get('status')

    if status == 'success':
        expected = float(payment.amount)
        actual = float(result.get('amount', 0))
        if abs(expected - actual) > 0.01:
            payment.status = Payment.STATUS_FAILED
            payment.failure_reason = f"Amount mismatch: expected {expected}, got {actual}"
            db.session.commit()
            return error_response("Payment amount mismatch", 400)

        raw = result.get('raw') or {}
        txn_id = str(raw.get('data', {}).get('id', '')) or None

        _finalize_payment(
            payment,
            raw_payload=raw,
            channel=result.get('channel'),
            transaction_id=txn_id,
        )

    elif status in ('failed', 'reversed'):
        payment.status = Payment.STATUS_FAILED
        payment.failure_reason = result.get('gateway_response') or status
        db.session.commit()

    elif status == 'abandoned':
        payment.status = Payment.STATUS_ABANDONED
        payment.failure_reason = "Customer abandoned checkout"
        db.session.commit()

    return success_response(data={
        'payment': payment.to_dict(),
        'subscription': payment.subscription.to_dict() if payment.subscription else None,
    })


# ─────────────────────────────────────────────────────────────
#  Webhook
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/paystack/webhook', methods=['POST'])
def paystack_webhook():
    """
    Paystack webhook handler.
    - Verifies HMAC-SHA512 signature (unless PAYSTACK_SKIP_WEBHOOK_SIGNATURE).
    - Idempotent.
    - Re-verifies via API before activating.
    """
    raw_body = request.get_data()
    signature = request.headers.get('x-paystack-signature', '')

    skip_sig = current_app.config.get('PAYSTACK_SKIP_WEBHOOK_SIGNATURE', False)
    if not skip_sig and not PaystackService.verify_webhook_signature(raw_body, signature):
        return error_response("Invalid signature", 401)

    try:
        event = json.loads(raw_body.decode('utf-8'))
    except Exception:
        return error_response("Invalid JSON", 400)

    event_type = event.get('event')
    data = event.get('data', {})
    reference = data.get('reference')

    if event_type != 'charge.success' or not reference:
        return {'received': True}, 200

    payment = Payment.query.filter_by(paystack_reference=reference).first()
    if not payment:
        return {'received': True, 'unknown_reference': True}, 200

    if payment.status == Payment.STATUS_COMPLETED:
        return {'received': True, 'already_processed': True}, 200

    result = PaystackService.verify_transaction(reference)
    if not result.get('success') or result.get('status') != 'success':
        return {'received': True, 'verify_failed': True}, 200

    expected = float(payment.amount)
    actual = float(result.get('amount', 0))
    if abs(expected - actual) > 0.01:
        payment.status = Payment.STATUS_FAILED
        payment.failure_reason = f"Webhook amount mismatch: {actual} vs {expected}"
        db.session.commit()
        return {'received': True, 'amount_mismatch': True}, 200

    _finalize_payment(
        payment,
        raw_payload=event,
        channel=data.get('channel'),
        transaction_id=str(data.get('id')) if data.get('id') else None,
    )

    return {'received': True}, 200


# ─────────────────────────────────────────────────────────────
#  History
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/history', methods=['GET'])
@jwt_required()
def payment_history():
    user = get_current_user()
    purpose = request.args.get('purpose')
    query = Payment.query.filter_by(user_id=user.id)
    if purpose:
        query = query.filter_by(purpose=purpose.upper())
    payments = query.order_by(Payment.created_at.desc()).all()
    return success_response(data={'payments': [p.to_dict() for p in payments]})