import uuid
from datetime import datetime, timezone
from sqlalchemy import Index, UniqueConstraint
from ..extensions import db


class TournamentTeam(db.Model):
    """
    Join table linking a Team to a Tournament.
    The relationship is defined on Tournament.tournament_teams
    (backref='tournament' provides TournamentTeam.tournament).
    """
    __tablename__ = 'tournament_teams'

    STATUS_INVITED = 'INVITED'
    STATUS_JOIN_REQUESTED = 'JOIN_REQUESTED'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_REGISTERED = 'REGISTERED'
    STATUS_WITHDRAWN = 'WITHDRAWN'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(
        db.String(36), db.ForeignKey('tournaments.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )
    team_id = db.Column(
        db.String(36), db.ForeignKey('teams.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )

    status = db.Column(db.String(20), default=STATUS_INVITED, nullable=False)
    invited_by_organizer = db.Column(db.Boolean, default=False, nullable=False)

    entry_payment_id = db.Column(
        db.String(36), db.ForeignKey('payments.id', ondelete='SET NULL'),
        nullable=True,
    )

    message = db.Column(db.Text)
    responded_at = db.Column(db.DateTime, nullable=True)
    registered_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # NOTE: `tournament` relationship is provided by the backref from
    # Tournament.tournament_teams. Do NOT redeclare it here.
    team = db.relationship('Team', backref='tournament_entries')
    entry_payment = db.relationship('Payment', foreign_keys=[entry_payment_id])

    __table_args__ = (
        UniqueConstraint('tournament_id', 'team_id', name='uq_tournament_team'),
        Index('idx_tournament_teams_tournament', 'tournament_id'),
        Index('idx_tournament_teams_team', 'team_id'),
        Index('idx_tournament_teams_status', 'status'),
    )

    def to_dict(self, include_team=True):
        data = {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'team_id': self.team_id,
            'status': self.status,
            'invited_by_organizer': self.invited_by_organizer,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
        }
        if include_team and self.team:
            data['team'] = self.team.to_dict(public=True)
        return data