import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    participant_one_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    participant_two_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Metadata
    last_message_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    participant_one = db.relationship('User', foreign_keys=[participant_one_id])
    participant_two = db.relationship('User', foreign_keys=[participant_two_id])
    messages = db.relationship('Message', backref='conversation', lazy='dynamic',
                               order_by='Message.created_at')

    __table_args__ = (
        db.UniqueConstraint('participant_one_id', 'participant_two_id', name='uq_conversation_participants'),
        Index('idx_conversations_participant_one', 'participant_one_id'),
        Index('idx_conversations_participant_two', 'participant_two_id'),
    )

    def get_other_participant(self, user_id):
        if self.participant_one_id == user_id:
            return self.participant_two
        return self.participant_one

    def to_dict(self, current_user_id=None):
        other = self.get_other_participant(current_user_id) if current_user_id else None
        return {
            'id': self.id,
            'other_participant': other.to_dict() if other else None,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipient_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Content
    body = db.Column(db.Text, nullable=False)

    # Attachment (optional)
    attachment_url = db.Column(db.String(500), nullable=True)
    attachment_type = db.Column(db.String(50), nullable=True)  # image, video, pdf

    # Status
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime, nullable=True)
    is_deleted_by_sender = db.Column(db.Boolean, default=False)
    is_deleted_by_recipient = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('idx_messages_conversation_id', 'conversation_id'),
        Index('idx_messages_sender_id', 'sender_id'),
        Index('idx_messages_recipient_id', 'recipient_id'),
        Index('idx_messages_is_read', 'is_read'),
        Index('idx_messages_created_at', 'created_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'body': self.body,
            'attachment_url': self.attachment_url,
            'attachment_type': self.attachment_type,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }