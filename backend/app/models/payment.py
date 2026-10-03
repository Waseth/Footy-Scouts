import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Payment(db.Model):
    __tablename__ = 'payments'

    # ── Gateway ──
    METHOD_PAYSTACK = 'PAYSTACK'

    # ── Status ──
    STATUS_PENDING = 'PENDING'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_FAILED = 'FAILED'
    STATUS_ABANDONED = 'ABANDONED'   # user started checkout and didn't finish
    STATUS_REFUNDED = 'REFUNDED'

    # ── Purpose ──
    PURPOSE_SUBSCRIPTION = 'SUBSCRIPTION'
    PURPOSE_TEAM_TOURNAMENT_ENTRY = 'TEAM_TOURNAMENT_ENTRY'
    PURPOSE_TOURNAMENT_FINAL = 'TOURNAMENT_FINAL'
    PURPOSE_OTHER = 'OTHER'

    # ── Currency ──
    CURRENCY_KES = 'KES'
    CURRENCY_USD = 'USD'
    CURRENCY_NGN = 'NGN'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    subscription_id = db.Column(db.String(36), db.ForeignKey('subscriptions.id', ondelete='SET NULL'), nullable=True)

    # ── Details ──
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), default=CURRENCY_KES, nullable=False)
    method = db.Column(db.String(20), default=METHOD_PAYSTACK, nullable=False)
    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False)
    purpose = db.Column(db.String(30), default=PURPOSE_SUBSCRIPTION, nullable=False)
    plan = db.Column(db.String(20), nullable=True)  # MONTHLY or ANNUAL (for SUBSCRIPTION)

    # ── Paystack references ──
    paystack_reference = db.Column(db.String(64), unique=True, nullable=True, index=True)
    paystack_access_code = db.Column(db.String(64), nullable=True)
    paystack_authorization_url = db.Column(db.String(500), nullable=True)
    paystack_channel = db.Column(db.String(40), nullable=True)   # card, mobile_money, bank...
    transaction_id = db.Column(db.String(64), nullable=True)     # Paystack transaction id

    # ── Contact (for mobile money / receipts) ──
    phone_number = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(255), nullable=True)

    # ── For non-subscription purposes ──
    team_id = db.Column(db.String(36), nullable=True)
    tournament_id = db.Column(db.String(36), nullable=True)

    # ── Metadata ──
    notes = db.Column(db.Text, nullable=True)
    failure_reason = db.Column(db.Text, nullable=True)
    raw_response = db.Column(db.Text, nullable=True)   # JSON string of last Paystack payload

    # ── Timestamps ──
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)

    subscription = db.relationship('Subscription', backref='payments')

    __table_args__ = (
        Index('idx_payments_user_id', 'user_id'),
        Index('idx_payments_status', 'status'),
        Index('idx_payments_method', 'method'),
        Index('idx_payments_purpose', 'purpose'),
        Index('idx_payments_reference', 'paystack_reference'),
    )

    def __repr__(self):
        return f'<Payment {self.id} - {self.method} - {self.status} - {self.purpose}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'currency': self.currency,
            'method': self.method,
            'status': self.status,
            'purpose': self.purpose,
            'plan': self.plan,
            'paystack_reference': self.paystack_reference,
            'transaction_id': self.transaction_id,
            'team_id': self.team_id,
            'tournament_id': self.tournament_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'failure_reason': self.failure_reason,
        }