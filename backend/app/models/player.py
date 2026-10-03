import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Player(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    full_name = db.Column(db.String(255), nullable=False)
    nationality = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    position = db.Column(db.String(100))
    current_team = db.Column(db.String(255))
    school = db.Column(db.String(255))
    contact_number = db.Column(db.String(30))
    show_contact = db.Column(db.Boolean, default=False)
    biography = db.Column(db.Text)
    profile_picture_url = db.Column(db.String(500))
    profile_picture_public_id = db.Column(db.String(255))
    is_featured = db.Column(db.Boolean, default=False)
    profile_views = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('player_profile', uselist=False))

    __table_args__ = (
        Index('idx_players_user_id', 'user_id'),
        Index('idx_players_position', 'position'),
        Index('idx_players_nationality', 'nationality'),
        Index('idx_players_gender', 'gender'),
        Index('idx_players_is_featured', 'is_featured'),
    )

    @property
    def age(self):
        if self.date_of_birth:
            today = datetime.now(timezone.utc).date()
            born = self.date_of_birth
            return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        return None

    def __repr__(self):
        return f'<Player {self.full_name}>'

    def to_dict(self, viewer=None, viewer_is_authenticated=False, include_contact=False):
        """
        Viewer-aware serialization.

        Tiers:
          - Guest (viewer=None, viewer_is_authenticated=False):
              name, position, nationality, current_team, biography,
              profile_picture_url, profile_views, is_premium, is_featured
          - Registered (viewer_is_authenticated=True):
              + age, gender, date_of_birth, school
          - Owner (viewer == self.user):
              + contact_number, email, user_id
          - include_contact=True (explicit override, e.g. owner view):
              + contact_number, email
        """
        is_owner = (
            viewer is not None
            and viewer_is_authenticated
            and getattr(self, 'user_id', None) == getattr(viewer, 'id', None)
        )

        data = {
            'id': self.id,
            'full_name': self.full_name,
            'position': self.position,
            'nationality': self.nationality,
            'current_team': self.current_team,
            'biography': self.biography,
            'profile_picture_url': self.profile_picture_url,
            'profile_views': self.profile_views or 0,
            'is_featured': bool(self.is_featured),
            'is_premium': self.user.is_premium() if self.user else False,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'requires_login_for_full_details': not viewer_is_authenticated,
        }

        # Registered users get "full details" (still not contact info)
        if viewer_is_authenticated:
            data.update({
                'age': self.age,
                'gender': self.gender,
                'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
                'school': self.school,
            })

        # Owner or explicit override → contact info
        if is_owner or include_contact:
            data.update({
                'user_id': self.user_id,
                'contact_number': self.contact_number,
                'email': self.user.email if self.user else None,
                'show_contact': bool(self.show_contact),
            })

        return data