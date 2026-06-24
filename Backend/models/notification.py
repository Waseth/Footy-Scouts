import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    title = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50))  # MESSAGE, SUBSCRIPTION, ADMIN, TOURNAMENT, etc.

    # Related object
    related_id = db.Column(db.String(36), nullable=True)
    related_type = db.Column(db.String(50), nullable=True)  # User, Tournament, etc.

    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('idx_notifications_user_id', 'user_id'),
        Index('idx_notifications_is_read', 'is_read'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'body': self.body,
            'notification_type': self.notification_type,
            'related_id': self.related_id,
            'related_type': self.related_type,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AdminAction(db.Model):
    __tablename__ = 'admin_actions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Target
    target_user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    target_type = db.Column(db.String(50))  # USER, SCOUT, INSTITUTION, TOURNAMENT, MEDIA

    # Action
    action = db.Column(db.String(100), nullable=False)  # APPROVE_SCOUT, SUSPEND_USER, etc.
    reason = db.Column(db.Text)
    notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    admin = db.relationship('User', foreign_keys=[admin_id], backref='admin_actions_performed')
    target_user = db.relationship('User', foreign_keys=[target_user_id])

    __table_args__ = (
        Index('idx_admin_actions_admin_id', 'admin_id'),
        Index('idx_admin_actions_target', 'target_user_id'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'target_user_id': self.target_user_id,
            'target_type': self.target_type,
            'action': self.action,
            'reason': self.reason,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }