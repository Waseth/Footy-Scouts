import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Institution(db.Model):
    __tablename__ = 'institutions'

    TYPES = ['SCHOOL', 'TEAM', 'ACADEMY', 'FOOTBALL_ORGANIZATION']

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    # Institution Info
    institution_name = db.Column(db.String(255), nullable=False)
    institution_type = db.Column(db.String(50), nullable=False)  # From TYPES list

    # Location
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))

    # Contact
    contact_number = db.Column(db.String(30))

    # Description
    description = db.Column(db.Text)

    # Logo
    logo_url = db.Column(db.String(500))
    logo_public_id = db.Column(db.String(255))

    # Admin verification — profile NOT public until admin verifies
    is_verified = db.Column(db.Boolean, default=False)
    verified_at = db.Column(db.DateTime, nullable=True)
    verified_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id],
                           backref=db.backref('institution_profile', uselist=False))
    verifier = db.relationship('User', foreign_keys=[verified_by])
    tournaments = db.relationship('Tournament', backref='organizer_institution', lazy='dynamic')

    __table_args__ = (
        Index('idx_institutions_user_id', 'user_id'),
        Index('idx_institutions_country', 'country'),
        Index('idx_institutions_type', 'institution_type'),
        Index('idx_institutions_is_verified', 'is_verified'),
    )

    def __repr__(self):
        return f'<Institution {self.institution_name}>'

    def to_dict(self, viewer=None, viewer_is_authenticated=False, public=True):
        """
        Tiered serialization.

        Guest / free authenticated:
            name, type, country, city, description, logo, verified
        Premium viewer:
            above + contact_number + email
        Owner:
            above + user_id
        """
        is_owner = (
            viewer is not None
            and viewer_is_authenticated
            and getattr(self, 'user_id', None) == getattr(viewer, 'id', None)
        )
        is_premium_viewer = (
            viewer is not None
            and viewer_is_authenticated
            and not is_owner
            and getattr(viewer, 'is_premium', lambda: False)()
        )

        data = {
            'id': self.id,
            'institution_name': self.institution_name,
            'institution_type': self.institution_type,
            'country': self.country,
            'city': self.city,
            'description': self.description,
            'logo_url': self.logo_url,
            'is_verified': bool(self.is_verified),
            'is_premium': self.user.is_premium() if self.user else False,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'requires_login_to_contact': not viewer_is_authenticated,
        }

        if viewer_is_authenticated:
            data['user_id'] = self.user_id

        if is_owner or is_premium_viewer or not public:
            data['contact_number'] = self.contact_number

        if is_owner or not public:
            data['email'] = self.user.email if self.user else None

        return data