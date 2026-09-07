import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Tournament(db.Model):
    __tablename__ = 'tournaments'

    TYPES = ['5-a-side', '7-a-side', '9-a-side', '11-a-side']
    STATUS_UPCOMING = 'UPCOMING'
    STATUS_ONGOING = 'ONGOING'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CANCELLED = 'CANCELLED'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organizer_user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    institution_id = db.Column(db.String(36), db.ForeignKey('institutions.id', ondelete='SET NULL'), nullable=True)

    # Organizer info
    organization_name = db.Column(db.String(255), nullable=False)
    representative_name = db.Column(db.String(255), nullable=False)
    organization_phone = db.Column(db.String(30))
    organization_email = db.Column(db.String(255))
    representative_phone = db.Column(db.String(30))
    representative_email = db.Column(db.String(255))

    # Tournament details
    tournament_name = db.Column(db.String(255), nullable=False)
    tournament_type = db.Column(db.String(20), nullable=False)  # From TYPES
    location = db.Column(db.String(255))
    registration_fee = db.Column(db.Numeric(10, 2), default=0)
    fee_currency = db.Column(db.String(10), default='KES')
    description = db.Column(db.Text)

    # Dates
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    registration_deadline = db.Column(db.DateTime)

    # Status
    status = db.Column(db.String(20), default=STATUS_UPCOMING)
    is_approved = db.Column(db.Boolean, default=False)  # Admin approves

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organizer = db.relationship('User', backref='organized_tournaments')
    participants = db.relationship('TournamentParticipant', backref='tournament', lazy='dynamic')

    __table_args__ = (
        Index('idx_tournaments_organizer', 'organizer_user_id'),
        Index('idx_tournaments_status', 'status'),
        Index('idx_tournaments_type', 'tournament_type'),
        Index('idx_tournaments_start_date', 'start_date'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'organization_name': self.organization_name,
            'representative_name': self.representative_name,
            'organization_email': self.organization_email,
            'organization_phone': self.organization_phone,
            'tournament_name': self.tournament_name,
            'tournament_type': self.tournament_type,
            'location': self.location,
            'registration_fee': float(self.registration_fee) if self.registration_fee else 0,
            'fee_currency': self.fee_currency,
            'description': self.description,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'registration_deadline': self.registration_deadline.isoformat() if self.registration_deadline else None,
            'status': self.status,
            'is_approved': self.is_approved,
            'participant_count': self.participants.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class TournamentParticipant(db.Model):
    __tablename__ = 'tournament_participants'

    TYPE_INDIVIDUAL = 'INDIVIDUAL'
    TYPE_TEAM = 'TEAM'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id = db.Column(db.String(36), db.ForeignKey('tournaments.id', ondelete='CASCADE'), nullable=False)
    registered_by_user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    participant_type = db.Column(db.String(20), nullable=False)  # INDIVIDUAL or TEAM

    # Individual fields
    name = db.Column(db.String(255))
    age = db.Column(db.Integer)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(30))

    # Team fields
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