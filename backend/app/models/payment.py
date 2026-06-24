import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Payment(db.Model):
    __tablename__ = 'payments'

    METHOD_MPESA = 'MPESA'
    METHOD_STRIPE = 'STRIPE'
    METHOD_PAYPAL = 'PAYPAL'

    STATUS_PENDING = 'PENDING'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_FAILED = 'FAILED'
    STATUS_REFUNDED = 'REFUNDED'

    CURRENCY_KES = 'KES'
    CURRENCY_USD = 'USD'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    subscription_id = db.Column(db.String(36), db.ForeignKey('subscriptions.id', ondelete='SET NULL'), nullable=True)

    # Payment details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), default=CURRENCY_KES, nullable=False)
    method = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False)

    # Plan purchased
    plan = db.Column(db.String(20), nullable=False)  # MONTHLY or ANNUAL

    # External references
    transaction_id = db.Column(db.String(255), unique=True, nullable=True)  # Gateway transaction ID
    mpesa_checkout_id = db.Column(db.String(255), nullable=True)
    mpesa_receipt = db.Column(db.String(255), nullable=True)
    stripe_payment_intent = db.Column(db.String(255), nullable=True)
    paypal_order_id = db.Column(db.String(255), nullable=True)

    # Phone (for M-Pesa)
    phone_number = db.Column(db.String(30), nullable=True)

    # Metadata
    notes = db.Column(db.Text, nullable=True)
    failure_reason = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)

    subscription = db.relationship('Subscription', backref='payments')

    __table_args__ = (
        Index('idx_payments_user_id', 'user_id'),
        Index('idx_payments_status', 'status'),
        Index('idx_payments_method', 'method'),
        Index('idx_payments_transaction_id', 'transaction_id'),
    )

    def __repr__(self):
        return f'<Payment {self.id} - {self.method} - {self.status}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'currency': self.currency,
            'method': self.method,
            'status': self.status,
            'plan': self.plan,
            'transaction_id': self.transaction_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }