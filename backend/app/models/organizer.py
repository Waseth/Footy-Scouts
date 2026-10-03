import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class OrganizerProfile(db.Model):
    """
    Organizer capability profile.
    A user with this row can create & manage tournaments.
    One-to-one with User.
    """
    __tablename__ = 'organizer_profiles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
                        unique=True, nullable=False)

    # Public-facing organizer identity
    display_name = db.Column(db.String(255), nullable=False)
    organization_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(30))
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    bio = db.Column(db.Text)

    # Logo (optional)
    logo_url = db.Column(db.String(500))
    logo_public_id = db.Column(db.String(255))

    # Moderation
    is_verified = db.Column(db.Boolean, default=False)
    is_suspended = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('organizer_profile', uselist=False))

    __table_args__ = (
        Index('idx_organizer_profiles_user_id', 'user_id'),
        Index('idx_organizer_profiles_is_verified', 'is_verified'),
    )

    def __repr__(self):
        return f'<OrganizerProfile {self.display_name}>'

    def to_dict(self, public=True):
        data = {
            'id': self.id,
            'display_name': self.display_name,
            'organization_name': self.organization_name,
            'country': self.country,
            'city': self.city,
            'bio': self.bio,
            'logo_url': self.logo_url,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if not public:
            data['user_id'] = self.user_id
            data['contact_email'] = self.contact_email
            data['contact_phone'] = self.contact_phone
            data['is_suspended'] = self.is_suspended
        return data