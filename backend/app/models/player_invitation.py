import uuid
from datetime import datetime, timezone
from sqlalchemy import Index, UniqueConstraint
from ..extensions import db


class PlayerInvitation(db.Model):
    """
    Captain invites a player to join their team.
    """
    __tablename__ = 'player_invitations'

    STATUS_PENDING = 'PENDING'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_EXPIRED = 'EXPIRED'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = db.Column(
        db.String(36),
        db.ForeignKey('teams.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    invited_user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    invited_by_user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
    )

    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False)
    message = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = db.Column(db.DateTime, nullable=True)

    invited_user = db.relationship('User', foreign_keys=[invited_user_id],
                                   backref=db.backref('received_player_invitations', lazy='dynamic'))
    invited_by = db.relationship('User', foreign_keys=[invited_by_user_id])

    __table_args__ = (
        Index('idx_player_invitations_status', 'status'),
        Index('idx_player_invitations_user', 'invited_user_id', 'status'),
    )

    def __repr__(self):
        return f'<PlayerInvitation team={self.team_id} player={self.invited_user_id} {self.status}>'

    def to_dict(self):
        return {
            'id': self.id,
            'team_id': self.team_id,
            'invited_user_id': self.invited_user_id,
            'invited_by_user_id': self.invited_by_user_id,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'team': self.team.to_dict() if self.team else None,
            'invited_by_email': self.invited_by.email if self.invited_by else None,
        }


class PlayerJoinRequest(db.Model):
    """
    Player requests to join a team.
    """
    __tablename__ = 'player_join_requests'

    STATUS_PENDING = 'PENDING'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CANCELLED = 'CANCELLED'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = db.Column(
        db.String(36),
        db.ForeignKey('teams.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )

    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False)
    message = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship('User', foreign_keys=[user_id],
                           backref=db.backref('team_join_requests', lazy='dynamic'))

    __table_args__ = (
        Index('idx_player_join_requests_status', 'status'),
        Index('idx_player_join_requests_team', 'team_id', 'status'),
    )

    def __repr__(self):
        return f'<PlayerJoinRequest team={self.team_id} user={self.user_id} {self.status}>'

    def to_dict(self):
        return {
            'id': self.id,
            'team_id': self.team_id,
            'user_id': self.user_id,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'team': self.team.to_dict() if self.team else None,
            'player': (
                self.user.player_profile.to_dict(
                    viewer=self.user, viewer_is_authenticated=True
                ) if self.user and self.user.player_profile else None
            ),
            'email': self.user.email if self.user else None,
        }