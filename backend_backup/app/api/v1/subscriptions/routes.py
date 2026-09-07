from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db
from ....models import Subscription, Payment
from ....utils.decorators import get_current_user
from ....utils.helpers import success_response, error_response

subscriptions_bp = Blueprint('subscriptions', __name__)


@subscriptions_bp.route('/plans', methods=['GET'])
def get_plans():
    """Return available subscription plans and prices (public endpoint)."""
    from flask import current_app
    plans = {
        'FREE': {
            'name': 'Free',
            'price_kes': 0,
            'price_usd': 0,
            'features': [
                'Create profile',
                'Upload content',
                'Browse scouts, institutions & tournaments',
            ],
            'limitations': [
                'Cannot contact scouts or institutions',
                'Cannot send or receive messages',
                'Contact details hidden',
            ],
        },
        'MONTHLY': {
            'name': 'Monthly Premium',
            'price_kes': current_app.config['MONTHLY_PRICE_KES'],
            'price_usd': current_app.config['MONTHLY_PRICE_USD'],
            'duration_days': 30,
            'features': [
                'All Free features',
                'Contact scouts and institutions',
                'Full internal messaging',
                'Display personal contact details',
                'Be contacted by scouts and institutions',
            ],
        },
        'ANNUAL': {
            'name': 'Annual Premium',
            'price_kes': current_app.config['ANNUAL_PRICE_KES'],
            'price_usd': current_app.config['ANNUAL_PRICE_USD'],
            'duration_days': 365,
            'savings': '17% off vs monthly',
            'features': [
                'All Monthly features',
                'Best value — save 17%',
            ],
        },
    }
    return success_response(data={'plans': plans})


@subscriptions_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_subscription():
    """Get the current user's subscription details."""
    user = get_current_user()
    sub = user.subscription
    if not sub:
        return error_response("No subscription found", 404)

    # Fetch payment history
    payments = Payment.query.filter_by(user_id=user.id).order_by(Payment.created_at.desc()).limit(10).all()

    return success_response(data={
        'subscription': sub.to_dict(),
        'payment_history': [p.to_dict() for p in payments],
    })


@subscriptions_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Cancel auto-renewal (subscription stays active until end_date)."""
    user = get_current_user()
    sub = user.subscription
    if not sub or sub.plan == Subscription.PLAN_FREE:
        return error_response("No active paid subscription to cancel", 400)

    sub.auto_renew = False
    sub.status = Subscription.STATUS_CANCELLED
    db.session.commit()

    return success_response(message="Subscription cancelled. You retain access until the period ends.")