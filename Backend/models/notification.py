"""
app/models/notification.py
──────────────────────────
User-facing in-app notification model.

These are the alerts users see inside the app — new messages, subscription
confirmations, account approvals, etc.

For the admin audit trail see app/models/admin_action.py — that is a
completely separate concern (internal logging, not user-facing).
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Notification(db.Model):
    __tablename__ = 'notifications'

    # ── Type constants ─────────────────────────────────────────────────────
    TYPE_MESSAGE      = 'MESSAGE'       # new message received
    TYPE_SUBSCRIPTION = 'SUBSCRIPTION'  # plan activated / expired / renewed
    TYPE_ADMIN        = 'ADMIN'         # account approved / suspended by admin
    TYPE_TOURNAMENT   = 'TOURNAMENT'    # tournament approved / cancelled
    TYPE_PAYMENT      = 'PAYMENT'       # payment confirmed or failed
    TYPE_SYSTEM       = 'SYSTEM'        # generic platform announcements

    ALL_TYPES = [
        TYPE_MESSAGE, TYPE_SUBSCRIPTION, TYPE_ADMIN,
        TYPE_TOURNAMENT, TYPE_PAYMENT, TYPE_SYSTEM,
    ]

    # ── Columns ────────────────────────────────────────────────────────────
    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )

    title             = db.Column(db.String(255), nullable=False)
    body              = db.Column(db.Text,        nullable=False)
    notification_type = db.Column(db.String(50),  nullable=True)

    # Optional deep-link back to the related object in the frontend
    related_id   = db.Column(db.String(36), nullable=True)   # e.g. conversation_id
    related_type = db.Column(db.String(50), nullable=True)   # e.g. 'Conversation'

    # Read state
    is_read = db.Column(db.Boolean,  default=False, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationship ───────────────────────────────────────────────────────
    # backref 'notifications' is declared on User via:
    #   User.notifications = db.relationship('Notification', backref='user', lazy='dynamic')

    # ── Indexes ────────────────────────────────────────────────────────────
    __table_args__ = (
        Index('idx_notifications_user_id',  'user_id'),
        Index('idx_notifications_is_read',  'is_read'),
        Index('idx_notifications_type',     'notification_type'),
        Index('idx_notifications_created',  'created_at'),
    )

    # ── Factory helpers ────────────────────────────────────────────────────
    @classmethod
    def create(cls, user_id: str, title: str, body: str,
               notification_type: str = TYPE_SYSTEM,
               related_id: str = None, related_type: str = None):
        """
        Convenience factory.  Creates, adds to session, and returns the object.
        Caller is responsible for db.session.commit().

        Example usage inside a service:
            Notification.create(
                user_id=user.id,
                title="New Message",
                body=f"You have a new message from {sender_name}",
                notification_type=Notification.TYPE_MESSAGE,
                related_id=conversation_id,
                related_type="Conversation",
            )
            db.session.commit()
        """
        notification = cls(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
            related_id=related_id,
            related_type=related_type,
        )
        db.session.add(notification)
        return notification

    # ── Instance helpers ───────────────────────────────────────────────────
    def mark_read(self):
        """Mark this notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.now(timezone.utc)

    # ── Serialisation ──────────────────────────────────────────────────────
    def to_dict(self):
        return {
            'id':                self.id,
            'user_id':           self.user_id,
            'title':             self.title,
            'body':              self.body,
            'notification_type': self.notification_type,
            'related_id':        self.related_id,
            'related_type':      self.related_type,
            'is_read':           self.is_read,
            'read_at':           self.read_at.isoformat() if self.read_at else None,
            'created_at':        self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return (
            f'<Notification [{self.notification_type}] '
            f'→ user={self.user_id} read={self.is_read}>'
        )