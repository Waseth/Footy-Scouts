import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class OrganizerPayout(db.Model):
    """
    Audit trail for payouts owed to tournament organizers.
    Created when the organizer confirms registration closure.
    Admin marks it as PAID after manually paying via bank / M-Pesa.
    """
    __tablename__ = 'organizer_payouts'

    STATUS_PENDING = 'PENDING'      # created, awaiting admin action
    STATUS_PAID = 'PAID'            # admin has paid
    STATUS_FAILED = 'FAILED'        # payment attempt failed
    STATUS_REFUNDED = 'REFUNDED'    # tournament cancelled → refunded to teams

    METHOD_BANK = 'BANK'
    METHOD_MPESA = 'MPESA'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    tournament_id = db.Column(
        db.String(36),
        db.ForeignKey('tournaments.id', ondelete='CASCADE'),
        nullable=False,
        unique=True,
        index=True,
    )
    organizer_user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )

    # Amounts
    gross_collected = db.Column(db.Numeric(12, 2), nullable=False)   # what teams paid
    platform_fee = db.Column(db.Numeric(12, 2), nullable=False)       # our commission
    net_to_organizer = db.Column(db.Numeric(12, 2), nullable=False)   # what organizer gets

    # Payout state
    status = db.Column(db.String(20), default=STATUS_PENDING, nullable=False)
    payout_code = db.Column(db.String(64), nullable=True, unique=True, index=True)

    # Admin payment details
    payment_method = db.Column(db.String(20), nullable=True)      # BANK | MPESA
    transaction_reference = db.Column(db.String(255), nullable=True)
    paid_by_admin_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
    )
    paid_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    tournament = db.relationship('Tournament', backref=db.backref('payout', uselist=False))
    organizer = db.relationship('User', foreign_keys=[organizer_user_id])
    paid_by = db.relationship('User', foreign_keys=[paid_by_admin_id])

    __table_args__ = (
        Index('idx_organizer_payouts_status', 'status'),
    )

    def __repr__(self):
        return f'<OrganizerPayout tournament={self.tournament_id} {self.status} net={self.net_to_organizer}>'

    def to_dict(self):
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'organizer_user_id': self.organizer_user_id,
            'gross_collected': float(self.gross_collected),
            'platform_fee': float(self.platform_fee),
            'net_to_organizer': float(self.net_to_organizer),
            'status': self.status,
            'payout_code': self.payout_code,
            'payment_method': self.payment_method,
            'transaction_reference': self.transaction_reference,
            'paid_by_admin_id': self.paid_by_admin_id,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'tournament_name': self.tournament.tournament_name if self.tournament else None,
            'organizer_email': self.organizer.email if self.organizer else None,
        }