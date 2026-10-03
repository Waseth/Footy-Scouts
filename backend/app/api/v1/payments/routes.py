import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import Payment, Subscription, User
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


def _activate_subscription(user: User, plan: str, payment: Payment):
    """Upgrade or create a subscription after successful payment."""
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
        pass  # Don't fail the payment if notification fails

    return sub


def _price_for_plan(plan: str) -> float:
    if plan == 'MONTHLY':
        return current_app.config['MONTHLY_PRICE_KES']
    if plan == 'ANNUAL':
        return current_app.config['ANNUAL_PRICE_KES']
    raise ValueError("Unsupported plan")


# ─────────────────────────────────────────────────────────────
#  Initialize
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/paystack/initialize', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def paystack_initialize():
    """
    Initialize a Paystack transaction for a subscription plan.

    SECURITY: amount is derived from server-side config by `plan`.
    Client cannot set the amount.
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
    })


# ─────────────────────────────────────────────────────────────
#  Verify
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/paystack/verify/<reference>', methods=['GET'])
@jwt_required()
def paystack_verify(reference):
    """
    Verify a Paystack transaction. Idempotent — safe to call multiple times.
    """
    user = get_current_user()
    payment = Payment.query.filter_by(paystack_reference=reference, user_id=user.id).first()
    if not payment:
        return error_response("Payment not found", 404)

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

        payment.status = Payment.STATUS_COMPLETED
        payment.transaction_id = str(result.get('raw', {}).get('data', {}).get('id', '')) or None
        payment.paystack_channel = result.get('channel')
        payment.completed_at = datetime.now(timezone.utc)
        payment.raw_response = json.dumps(result.get('raw'))
        db.session.commit()

        if payment.purpose == Payment.PURPOSE_SUBSCRIPTION and payment.plan:
            _activate_subscription(user, payment.plan, payment)

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
    - Verifies HMAC-SHA512 signature
    - Idempotent
    - Re-verifies via API before activating
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

    payment.status = Payment.STATUS_COMPLETED
    payment.transaction_id = str(data.get('id')) or payment.transaction_id
    payment.paystack_channel = data.get('channel') or payment.paystack_channel
    payment.completed_at = datetime.now(timezone.utc)
    payment.raw_response = json.dumps(event)
    db.session.commit()

    if payment.purpose == Payment.PURPOSE_SUBSCRIPTION and payment.plan:
        user = db.session.get(User, payment.user_id)   # ← fixed
        if user:
            _activate_subscription(user, payment.plan, payment)

    return {'received': True}, 200


# ─────────────────────────────────────────────────────────────
#  STUBS — Tournament payments
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/paystack/initialize/team-entry', methods=['POST'])
@jwt_required()
def paystack_initialize_team_entry():
    return error_response(
        "Team tournament payments are not yet available. Coming soon.",
        501,
        errors={'code': 'NOT_IMPLEMENTED', 'purpose': 'TEAM_TOURNAMENT_ENTRY'},
    )


@payments_bp.route('/paystack/initialize/tournament-final', methods=['POST'])
@jwt_required()
def paystack_initialize_tournament_final():
    return error_response(
        "Tournament final payments are not yet available. Coming soon.",
        501,
        errors={'code': 'NOT_IMPLEMENTED', 'purpose': 'TOURNAMENT_FINAL'},
    )


# ─────────────────────────────────────────────────────────────
#  History
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/history', methods=['GET'])
@jwt_required()
def payment_history():
    user = get_current_user()
    payments = Payment.query.filter_by(user_id=user.id).order_by(Payment.created_at.desc()).all()
    return success_response(data={'payments': [p.to_dict() for p in payments]})