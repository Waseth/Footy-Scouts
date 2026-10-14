import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class WaitlistSignup(db.Model):
    __tablename__ = 'waitlist_signups'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    source = db.Column(db.String(50), default='merch')  # 'merch' | 'blog' | 'tournament' etc
    notified = db.Column(db.Boolean, default=False)     # set true when you email them about launch
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('idx_waitlist_email', 'email'),
        Index('idx_waitlist_source', 'source'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'source': self.source,
            'notified': self.notified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }