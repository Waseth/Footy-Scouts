import stripe
from flask import current_app


class StripeService:

    @staticmethod
    def _init():
        stripe.api_key = current_app.config['STRIPE_SECRET_KEY']

    @staticmethod
    def create_payment_intent(amount_usd: float, currency: str = 'usd', metadata: dict = None) -> dict:
        """Create a Stripe PaymentIntent. amount in USD (will be converted to cents)."""
        StripeService._init()
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount_usd * 100),  # Convert to cents
                currency=currency.lower(),
                metadata=metadata or {},
                automatic_payment_methods={'enabled': True},
            )
            return {
                'success': True,
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
            }
        except stripe.error.StripeError as e:
            return {'success': False, 'error': str(e.user_message)}

    @staticmethod
    def confirm_payment_intent(payment_intent_id: str) -> dict:
        """Check PaymentIntent status."""
        StripeService._init()
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                'success': True,
                'status': intent.status,
                'amount': intent.amount / 100,
                'currency': intent.currency,
                'payment_intent_id': intent.id,
            }
        except stripe.error.StripeError as e:
            return {'success': False, 'error': str(e.user_message)}

    @staticmethod
    def construct_webhook_event(payload: bytes, sig_header: str) -> dict:
        """Verify and construct a Stripe webhook event."""
        StripeService._init()
        webhook_secret = current_app.config['STRIPE_WEBHOOK_SECRET']
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            return {'success': True, 'event': event}
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def refund_payment(payment_intent_id: str, amount_cents: int = None) -> dict:
        """Refund a payment."""
        StripeService._init()
        try:
            params = {'payment_intent': payment_intent_id}
            if amount_cents:
                params['amount'] = amount_cents
            refund = stripe.Refund.create(**params)
            return {'success': True, 'refund_id': refund.id, 'status': refund.status}
        except stripe.error.StripeError as e:
            return {'success': False, 'error': str(e.user_message)}