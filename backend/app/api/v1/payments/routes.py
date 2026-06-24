import json
from datetime import datetime, timezone
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import Payment, Subscription, User
from ....services.mpesa_service import MpesaService
from ....services.stripe_service import StripeService
from ....services.paypal_service import PayPalService
from ....services.email_service import EmailService
from ....services.notification_service import NotificationService
from ....utils.decorators import get_current_user
from ....utils.helpers import success_response, error_response, get_subscription_end_date
from ....utils.validators import validate_phone

payments_bp = Blueprint('payments', __name__)


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

    # Notify user
    NotificationService.notify_subscription_activated(user.id, plan)
    EmailService.send_subscription_confirmation(user.email, plan, sub.end_date)
    return sub


# ─────────────────────────────────────────────────────────────
#  M-PESA
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/mpesa/initiate', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def mpesa_initiate():
    """Initiate M-Pesa STK Push payment."""
    user = get_current_user()
    data = request.get_json()

    plan = data.get('plan', '').upper()
    phone = data.get('phone_number', '').strip()

    if plan not in ['MONTHLY', 'ANNUAL']:
        return error_response("plan must be MONTHLY or ANNUAL", 400)
    if not phone or not validate_phone(phone):
        return error_response("Valid phone number required (e.g. 0712345678)", 400)

    amount = current_app.config['MONTHLY_PRICE_KES'] if plan == 'MONTHLY' else current_app.config['ANNUAL_PRICE_KES']

    # Create a pending payment record first
    payment = Payment(
        user_id=user.id,
        amount=amount,
        currency=Payment.CURRENCY_KES,
        method=Payment.METHOD_MPESA,
        status=Payment.STATUS_PENDING,
        plan=plan,
        phone_number=phone,
    )
    db.session.add(payment)
    db.session.commit()

    result = MpesaService.stk_push(
        phone_number=phone,
        amount=amount,
        account_ref=f"FS{user.id[:8].upper()}",
        description=f"FootyScout {plan}",
    )

    if not result.get('success'):
        payment.status = Payment.STATUS_FAILED
        payment.failure_reason = result.get('error')
        db.session.commit()
        return error_response(f"M-Pesa request failed: {result.get('error')}", 502)

    payment.mpesa_checkout_id = result['checkout_request_id']
    db.session.commit()

    return success_response(data={
        'payment_id': payment.id,
        'checkout_request_id': result['checkout_request_id'],
        'customer_message': result.get('customer_message', 'Check your phone for the M-Pesa prompt.'),
        'amount': amount,
        'currency': 'KES',
    }, status_code=202)


@payments_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """M-Pesa callback URL — called by Safaricom servers."""
    data = request.get_json(silent=True) or {}
    result = MpesaService.process_callback(data)

    checkout_id = result.get('checkout_request_id')
    payment = Payment.query.filter_by(mpesa_checkout_id=checkout_id).first()
    if not payment:
        return {'ResultCode': 0, 'ResultDesc': 'Accepted'}, 200  # Always return 200 to Safaricom

    if result.get('success'):
        payment.status = Payment.STATUS_COMPLETED
        payment.mpesa_receipt = result.get('mpesa_receipt')
        payment.transaction_id = result.get('mpesa_receipt')
        payment.completed_at = datetime.now(timezone.utc)
        db.session.commit()

        user = User.query.get(payment.user_id)
        if user:
            _activate_subscription(user, payment.plan, payment)
    else:
        payment.status = Payment.STATUS_FAILED
        payment.failure_reason = result.get('result_desc')
        db.session.commit()

    return {'ResultCode': 0, 'ResultDesc': 'Accepted'}, 200


@payments_bp.route('/mpesa/status/<payment_id>', methods=['GET'])
@jwt_required()
def mpesa_status(payment_id):
    """Poll M-Pesa payment status."""
    user = get_current_user()
    payment = Payment.query.filter_by(id=payment_id, user_id=user.id).first()
    if not payment:
        return error_response("Payment not found", 404)

    return success_response(data={'payment': payment.to_dict()})


# ─────────────────────────────────────────────────────────────
#  STRIPE
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/stripe/create-intent', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def stripe_create_intent():
    """Create a Stripe PaymentIntent and return client_secret to frontend."""
    user = get_current_user()
    data = request.get_json()
    plan = data.get('plan', '').upper()

    if plan not in ['MONTHLY', 'ANNUAL']:
        return error_response("plan must be MONTHLY or ANNUAL", 400)

    amount_usd = current_app.config['MONTHLY_PRICE_USD'] if plan == 'MONTHLY' else current_app.config['ANNUAL_PRICE_USD']

    # Create pending payment record
    payment = Payment(
        user_id=user.id,
        amount=amount_usd,
        currency=Payment.CURRENCY_USD,
        method=Payment.METHOD_STRIPE,
        status=Payment.STATUS_PENDING,
        plan=plan,
    )
    db.session.add(payment)
    db.session.flush()

    result = StripeService.create_payment_intent(
        amount_usd=amount_usd,
        metadata={'payment_id': payment.id, 'user_id': user.id, 'plan': plan},
    )

    if not result.get('success'):
        db.session.rollback()
        return error_response(f"Stripe error: {result.get('error')}", 502)

    payment.stripe_payment_intent = result['payment_intent_id']
    db.session.commit()

    return success_response(data={
        'client_secret': result['client_secret'],
        'payment_id': payment.id,
        'amount_usd': amount_usd,
    })


@payments_bp.route('/stripe/confirm', methods=['POST'])
@jwt_required()
def stripe_confirm():
    """Confirm a Stripe payment after frontend completes it."""
    user = get_current_user()
    data = request.get_json()
    payment_intent_id = data.get('payment_intent_id')

    if not payment_intent_id:
        return error_response("payment_intent_id required", 400)

    payment = Payment.query.filter_by(
        stripe_payment_intent=payment_intent_id,
        user_id=user.id,
    ).first()
    if not payment:
        return error_response("Payment record not found", 404)

    result = StripeService.confirm_payment_intent(payment_intent_id)
    if not result.get('success'):
        return error_response(result.get('error'), 502)

    if result['status'] == 'succeeded':
        payment.status = Payment.STATUS_COMPLETED
        payment.transaction_id = payment_intent_id
        payment.completed_at = datetime.now(timezone.utc)
        db.session.commit()
        _activate_subscription(user, payment.plan, payment)
        return success_response(message="Payment successful! Subscription activated.")

    return success_response(data={'status': result['status']})


@payments_bp.route('/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Stripe webhook for async payment events."""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature', '')

    result = StripeService.construct_webhook_event(payload, sig_header)
    if not result.get('success'):
        return error_response("Webhook signature verification failed", 400)

    event = result['event']
    if event['type'] == 'payment_intent.succeeded':
        pi = event['data']['object']
        payment = Payment.query.filter_by(stripe_payment_intent=pi['id']).first()
        if payment and payment.status != Payment.STATUS_COMPLETED:
            payment.status = Payment.STATUS_COMPLETED
            payment.transaction_id = pi['id']
            payment.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            user = User.query.get(payment.user_id)
            if user:
                _activate_subscription(user, payment.plan, payment)

    return {'received': True}, 200


# ─────────────────────────────────────────────────────────────
#  PAYPAL
# ─────────────────────────────────────────────────────────────

@payments_bp.route('/paypal/create-order', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def paypal_create_order():
    """Create a PayPal order and return approve_url."""
    user = get_current_user()
    data = request.get_json()
    plan = data.get('plan', '').upper()

    if plan not in ['MONTHLY', 'ANNUAL']:
        return error_response("plan must be MONTHLY or ANNUAL", 400)

    amount_usd = current_app.config['MONTHLY_PRICE_USD'] if plan == 'MONTHLY' else current_app.config['ANNUAL_PRICE_USD']
    frontend_url = current_app.config.get('FRONTEND_URL', '')

    payment = Payment(
        user_id=user.id,
        amount=amount_usd,
        currency=Payment.CURRENCY_USD,
        method=Payment.METHOD_PAYPAL,
        status=Payment.STATUS_PENDING,
        plan=plan,
    )
    db.session.add(payment)
    db.session.flush()

    result = PayPalService.create_order(
        amount_usd=amount_usd,
        description=f"FootyScout {plan} Subscription",
        return_url=f"{frontend_url}/payment/paypal/success?payment_id={payment.id}",
        cancel_url=f"{frontend_url}/payment/paypal/cancel?payment_id={payment.id}",
    )

    if not result.get('success'):
        db.session.rollback()
        return error_response(f"PayPal error: {result.get('error')}", 502)

    payment.paypal_order_id = result['order_id']
    db.session.commit()

    return success_response(data={
        'order_id': result['order_id'],
        'approve_url': result['approve_url'],
        'payment_id': payment.id,
    })


@payments_bp.route('/paypal/capture', methods=['POST'])
@jwt_required()
def paypal_capture():
    """Capture (complete) PayPal order after user approves on PayPal."""
    user = get_current_user()
    data = request.get_json()
    order_id = data.get('order_id')

    if not order_id:
        return error_response("order_id required", 400)

    payment = Payment.query.filter_by(paypal_order_id=order_id, user_id=user.id).first()
    if not payment:
        return error_response("Payment record not found", 404)

    result = PayPalService.capture_order(order_id)
    if not result.get('success'):
        payment.status = Payment.STATUS_FAILED
        payment.failure_reason = result.get('error')
        db.session.commit()
        return error_response(f"PayPal capture failed: {result.get('error')}", 502)

    payment.status = Payment.STATUS_COMPLETED
    payment.transaction_id = result.get('capture_id')
    payment.completed_at = datetime.now(timezone.utc)
    db.session.commit()

    _activate_subscription(user, payment.plan, payment)
    return success_response(message="Payment successful! Subscription activated.")


@payments_bp.route('/history', methods=['GET'])
@jwt_required()
def payment_history():
    """Get current user's payment history."""
    user = get_current_user()
    payments = Payment.query.filter_by(user_id=user.id).order_by(Payment.created_at.desc()).all()
    return success_response(data={'payments': [p.to_dict() for p in payments]})