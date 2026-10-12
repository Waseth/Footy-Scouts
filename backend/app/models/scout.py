import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Scout(db.Model):
    __tablename__ = 'scouts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    scout_name = db.Column(db.String(255), nullable=False)
    scout_type = db.Column(db.String(50), default='INDIVIDUAL')  # INDIVIDUAL or AGENCY
    agency_name = db.Column(db.String(255), nullable=True)

    country = db.Column(db.String(100))
    city = db.Column(db.String(100))

    # Public contact (shown to owner + premium viewers only)
    contact_number = db.Column(db.String(30))
    # For Call/WhatsApp buttons — required for verified scouts
    phone_number = db.Column(db.String(30))

    biography = db.Column(db.Text)

    profile_picture_url = db.Column(db.String(500))
    profile_picture_public_id = db.Column(db.String(255))

    is_verified = db.Column(db.Boolean, default=False)
    verified_at = db.Column(db.DateTime, nullable=True)
    verified_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', foreign_keys=[user_id],
                           backref=db.backref('scout_profile', uselist=False))
    verifier = db.relationship('User', foreign_keys=[verified_by])

    __table_args__ = (
        Index('idx_scouts_user_id', 'user_id'),
        Index('idx_scouts_country', 'country'),
        Index('idx_scouts_is_verified', 'is_verified'),
        Index('idx_scouts_scout_type', 'scout_type'),
    )

    def __repr__(self):
        return f'<Scout {self.scout_name}>'

    def to_dict(self, viewer=None, viewer_is_authenticated=False, public=True):
        """
        Tiered serialization.

        Guest:           name, type, agency, country, city, bio, picture, verified
        Registered:      above + is_premium flag
        Owner:           + contact_number, phone_number, email
        Premium viewer:  + contact_number, phone_number (but NOT email)
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
            'scout_name': self.scout_name,
            'scout_type': self.scout_type,
            'agency_name': self.agency_name,
            'country': self.country,
            'city': self.city,
            'biography': self.biography,
            'profile_picture_url': self.profile_picture_url,
            'is_verified': bool(self.is_verified),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'requires_login_to_contact': not viewer_is_authenticated,
        }

        if viewer_is_authenticated:
            data['user_id'] = self.user_id
            data['is_premium'] = self.user.is_premium() if self.user else False

        # Contact info: owner OR premium viewer only
        if is_owner or is_premium_viewer or not public:
            data['contact_number'] = self.contact_number
            data['phone_number'] = self.phone_number

        if is_owner:
            data['email'] = self.user.email if self.user else None

        return data