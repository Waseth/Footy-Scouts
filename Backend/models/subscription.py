import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Subscription(db.Model):
    __tablename__ = 'subscriptions'

    PLAN_FREE = 'FREE'
    PLAN_MONTHLY = 'MONTHLY'
    PLAN_ANNUAL = 'ANNUAL'

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_EXPIRED = 'EXPIRED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_PENDING = 'PENDING'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    plan = db.Column(db.String(20), default=PLAN_FREE, nullable=False)
    status = db.Column(db.String(20), default=STATUS_ACTIVE, nullable=False)

    # Dates
    start_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    end_date = db.Column(db.DateTime, nullable=True)  # None for FREE
    renewal_date = db.Column(db.DateTime, nullable=True)

    # Auto-renewal
    auto_renew = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('idx_subscriptions_user_id', 'user_id'),
        Index('idx_subscriptions_status', 'status'),
        Index('idx_subscriptions_plan', 'plan'),
    )

    def is_active(self):
        if self.plan == self.PLAN_FREE:
            return True
        if self.status != self.STATUS_ACTIVE:
            return False
        if self.end_date and datetime.now(timezone.utc) > self.end_date:
            return False
        return True

    def is_premium(self):
        return self.plan in [self.PLAN_MONTHLY, self.PLAN_ANNUAL] and self.is_active()

    def __repr__(self):
        return f'<Subscription {self.user_id} - {self.plan}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan': self.plan,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'renewal_date': self.renewal_date.isoformat() if self.renewal_date else None,
            'auto_renew': self.auto_renew,
            'is_active': self.is_active(),
            'is_premium': self.is_premium(),
        }