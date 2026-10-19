import uuid
from datetime import datetime, timezone
from sqlalchemy import Index, UniqueConstraint
from ..extensions import db


class Team(db.Model):
    """
    A football team managed by a captain.
    Teams are permanent entities — reusable across multiple tournaments.
    The captain must be a player (enforced in route).
    """
    __tablename__ = 'teams'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    captain_user_id = db.Column(
        db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    logo_url = db.Column(db.String(500))
    logo_public_id = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    captain = db.relationship('User', foreign_keys=[captain_user_id],
                              backref=db.backref('captained_teams', lazy='dynamic'))
    members = db.relationship('TeamMember', backref='team', lazy='dynamic',
                              cascade='all, delete-orphan')

    __table_args__ = (
        Index('idx_teams_captain', 'captain_user_id'),
        Index('idx_teams_name', 'name'),
    )

    def active_members_count(self):
        """Number of ACTIVE players on the team."""
        return self.members.filter_by(status=TeamMember.STATUS_ACTIVE).count()

    def active_members(self):
        return self.members.filter_by(status=TeamMember.STATUS_ACTIVE).all()

    def to_dict(self, public=True, viewer=None):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'logo_url': self.logo_url,
            'member_count': self.active_members_count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if not public:
            data['captain_user_id'] = self.captain_user_id
            data['captain_email'] = self.captain.email if self.captain else None
        return data

    def __repr__(self):
        return f'<Team {self.name}>'


class TeamMember(db.Model):
    """A player who is part of a team."""
    __tablename__ = 'team_members'

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_REMOVED = 'REMOVED'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = db.Column(db.String(36), db.ForeignKey('teams.id', ondelete='CASCADE'),
                        nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
                        nullable=False, index=True)

    status = db.Column(db.String(20), default=STATUS_ACTIVE, nullable=False)
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    removed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship('User', foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint('team_id', 'user_id', name='uq_team_member'),
        Index('idx_team_members_team', 'team_id'),
        Index('idx_team_members_user', 'user_id'),
        Index('idx_team_members_status', 'status'),
    )

    def to_dict(self):
        player = getattr(self.user, 'player_profile', None)
        return {
            'id': self.id,
            'team_id': self.team_id,
            'user_id': self.user_id,
            'status': self.status,
            'player_name': player.full_name if player else None,
            'player_position': player.position if player else None,
            'player_picture_url': player.profile_picture_url if player else None,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
        }

    def __repr__(self):
        return f'<TeamMember team={self.team_id} user={self.user_id} {self.status}>'


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
    team_id = db.Column(db.String(36), db.ForeignKey('teams.id', ondelete='CASCADE'),
                        nullable=False, index=True)
    invited_user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
                                nullable=False, index=True)
    invited_by_user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
                                   nullable=False)

    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False)
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = db.Column(db.DateTime, nullable=True)

    team = db.relationship('Team', backref='player_invitations')
    invited_user = db.relationship('User', foreign_keys=[invited_user_id])
    invited_by = db.relationship('User', foreign_keys=[invited_by_user_id])

    __table_args__ = (
        Index('idx_player_invitations_team', 'team_id'),
        Index('idx_player_invitations_invitee', 'invited_user_id'),
        Index('idx_player_invitations_status', 'status'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'team_id': self.team_id,
            'team_name': self.team.name if self.team else None,
            'invited_user_id': self.invited_user_id,
            'invited_by_user_id': self.invited_by_user_id,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
        }


class PlayerJoinRequest(db.Model):
    """
    A player requests to join a team. Captain approves or rejects.
    """
    __tablename__ = 'player_join_requests'

    STATUS_PENDING = 'PENDING'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CANCELLED = 'CANCELLED'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = db.Column(db.String(36), db.ForeignKey('teams.id', ondelete='CASCADE'),
                        nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
                        nullable=False, index=True)

    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False)
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = db.Column(db.DateTime, nullable=True)

    team = db.relationship('Team', backref='player_join_requests')
    user = db.relationship('User', foreign_keys=[user_id])

    __table_args__ = (
        Index('idx_player_join_requests_team', 'team_id'),
        Index('idx_player_join_requests_user', 'user_id'),
        Index('idx_player_join_requests_status', 'status'),
    )

    def to_dict(self):
        player = getattr(self.user, 'player_profile', None)
        return {
            'id': self.id,
            'team_id': self.team_id,
            'team_name': self.team.name if self.team else None,
            'user_id': self.user_id,
            'player_name': player.full_name if player else None,
            'player_position': player.position if player else None,
            'player_picture_url': player.profile_picture_url if player else None,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
        }