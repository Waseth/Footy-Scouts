import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class Player(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    # Personal Info
    full_name = db.Column(db.String(255), nullable=False)
    nationality = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))  # Male, Female, Other

    # Football Info
    position = db.Column(db.String(100))    # Goalkeeper, Defender, Midfielder, Forward
    current_team = db.Column(db.String(255))
    school = db.Column(db.String(255))

    # Contact (only visible to premium users or when player is premium)
    contact_number = db.Column(db.String(30))
    show_contact = db.Column(db.Boolean, default=False)  # player can toggle

    # Bio
    biography = db.Column(db.Text)

    # Profile Picture
    profile_picture_url = db.Column(db.String(500))
    profile_picture_public_id = db.Column(db.String(255))  # Cloudinary public_id

    # Admin actions
    is_featured = db.Column(db.Boolean, default=False)  # featured by admin

    # Stats
    profile_views = db.Column(db.Integer, default=0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', backref=db.backref('player_profile', uselist=False))
    media = db.relationship('MediaUpload', backref='player', lazy='dynamic',
                            primaryjoin="and_(MediaUpload.user_id == foreign(Player.user_id))",
                            foreign_keys='MediaUpload.user_id', overlaps='media_uploads,user')

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

    def to_dict(self, include_contact=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'nationality': self.nationality,
            'age': self.age,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'position': self.position,
            'current_team': self.current_team,
            'school': self.school,
            'biography': self.biography,
            'profile_picture_url': self.profile_picture_url,
            'is_featured': self.is_featured,
            'profile_views': self.profile_views,
            'is_premium': self.user.is_premium() if self.user else False,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_contact or self.show_contact:
            data['contact_number'] = self.contact_number
            data['email'] = self.user.email if self.user else None
        return data