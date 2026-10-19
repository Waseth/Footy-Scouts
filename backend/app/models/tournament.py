import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Tournament(db.Model):
    __tablename__ = 'tournaments'

    # ── Existing constants ──
    TYPES = ['5-a-side', '7-a-side', '9-a-side', '11-a-side']
    STATUS_UPCOMING = 'UPCOMING'
    STATUS_ONGOING = 'ONGOING'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CANCELLED = 'CANCELLED'

    # ── New state machine ──
    ST_DRAFT = 'DRAFT'
    ST_PUBLISHED = 'PUBLISHED'
    ST_REGISTRATION_OPEN = 'REGISTRATION_OPEN'
    ST_FILLING_TEAMS = 'FILLING_TEAMS'
    ST_ALL_TEAMS_REGISTERED = 'ALL_TEAMS_REGISTERED'
    ST_REGISTRATION_CLOSED = 'REGISTRATION_CLOSED'
    ST_IN_PROGRESS = 'IN_PROGRESS'
    ST_COMPLETED = 'COMPLETED'
    ST_CANCELLED = 'CANCELLED'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organizer_user_id = db.Column(
        db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )
    institution_id = db.Column(
        db.String(36), db.ForeignKey('institutions.id', ondelete='SET NULL'),
        nullable=True,
    )

    # Organizer info
    organization_name = db.Column(db.String(255), nullable=False)
    representative_name = db.Column(db.String(255), nullable=False)
    organization_phone = db.Column(db.String(30))
    organization_email = db.Column(db.String(255))
    representative_phone = db.Column(db.String(30))
    representative_email = db.Column(db.String(255))

    # Tournament details
    tournament_name = db.Column(db.String(255), nullable=False)
    tournament_type = db.Column(db.String(20), nullable=False)
    location = db.Column(db.String(255))
    description = db.Column(db.Text)

    # Registration requirements
    required_teams = db.Column(db.Integer, default=8, nullable=False)
    min_players_per_team = db.Column(db.Integer, default=5, nullable=False)
    max_players_per_team = db.Column(db.Integer, default=8, nullable=False)

    # Pricing
    team_entry_fee = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    platform_fee_per_team = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    tournament_fee_total = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    total_required_from_teams = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    fee_currency = db.Column(db.String(10), default='KES', nullable=False)

    # Dates
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    registration_deadline = db.Column(db.DateTime)

    # Status & lifecycle
    status = db.Column(db.String(30), default=ST_DRAFT, nullable=False)
    is_approved = db.Column(db.Boolean, default=False)
    published_at = db.Column(db.DateTime, nullable=True)
    registration_closed_at = db.Column(db.DateTime, nullable=True)

    # Payout tracking
    payout_code = db.Column(db.String(50), nullable=True, index=True)
    payout_status = db.Column(db.String(20), default='PENDING', nullable=False)
    paid_out_at = db.Column(db.DateTime, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # ── Relationships (explicit — do NOT rely on backref ordering) ──
    organizer = db.relationship('User', backref='organized_tournaments')
    participants = db.relationship(
        'TournamentParticipant',
        backref='tournament',
        lazy='dynamic',
        cascade='all, delete-orphan',
    )
    # 🆕 Explicit relationship to tournament_teams (avoids import-order issue)
    tournament_teams = db.relationship(
        'TournamentTeam',
        backref='tournament',
        lazy='dynamic',
        cascade='all, delete-orphan',
        foreign_keys='TournamentTeam.tournament_id',
    )

    __table_args__ = (
        Index('idx_tournaments_organizer', 'organizer_user_id'),
        Index('idx_tournaments_status', 'status'),
        Index('idx_tournaments_type', 'tournament_type'),
        Index('idx_tournaments_start_date', 'start_date'),
        Index('idx_tournaments_payout_code', 'payout_code'),
    )

    # ── Helpers ──
    def registered_teams_count(self):
        """Number of teams that have paid and are officially registered."""
        return self.tournament_teams.filter_by(status='REGISTERED').count()

    def accepted_teams_count(self):
        """Accepted teams building squad, not yet paid."""
        return self.tournament_teams.filter_by(status='ACCEPTED').count()

    def is_full(self):
        return self.registered_teams_count() >= self.required_teams

    def can_close_registration(self):
        return self.registered_teams_count() >= self.required_teams

    def to_dict(self):
        return {
            'id': self.id,
            'organizer_user_id': self.organizer_user_id,
            'organization_name': self.organization_name,
            'representative_name': self.representative_name,
            'organization_email': self.organization_email,
            'organization_phone': self.organization_phone,
            'tournament_name': self.tournament_name,
            'tournament_type': self.tournament_type,
            'location': self.location,
            'description': self.description,
            'required_teams': self.required_teams,
            'min_players_per_team': self.min_players_per_team,
            'max_players_per_team': self.max_players_per_team,
            'team_entry_fee': float(self.team_entry_fee or 0),
            'platform_fee_per_team': float(self.platform_fee_per_team or 0),
            'tournament_fee_total': float(self.tournament_fee_total or 0),
            'total_required_from_teams': float(self.total_required_from_teams or 0),
            'fee_currency': self.fee_currency,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'registration_deadline': self.registration_deadline.isoformat() if self.registration_deadline else None,
            'status': self.status,
            'is_approved': self.is_approved,
            'registered_teams_count': self.registered_teams_count(),
            'accepted_teams_count': self.accepted_teams_count(),
            'payout_code': self.payout_code,
            'payout_status': self.payout_status,
            'paid_out_at': self.paid_out_at.isoformat() if self.paid_out_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Tournament {self.tournament_name} ({self.status})>'


class TournamentParticipant(db.Model):
    """Legacy individual participant — kept for backwards compat."""
    __tablename__ = 'tournament_participants'

    TYPE_INDIVIDUAL = 'INDIVIDUAL'
    TYPE_TEAM = 'TEAM'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(
        db.String(36), db.ForeignKey('tournaments.id', ondelete='CASCADE'),
        nullable=False,
    )
    registered_by_user_id = db.Column(
        db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
    )

    participant_type = db.Column(db.String(20), nullable=False)

    name = db.Column(db.String(255))
    age = db.Column(db.Integer)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(30))

    team_name = db.Column(db.String(255))
    team_representative = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('idx_tournament_participants_tournament', 'tournament_id'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'participant_type': self.participant_type,
            'name': self.name,
            'age': self.age,
            'email': self.email,
            'phone': self.phone,
            'team_name': self.team_name,
            'team_representative': self.team_representative,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }