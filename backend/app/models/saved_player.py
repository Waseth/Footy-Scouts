import uuid
from datetime import datetime, timezone
from sqlalchemy import Index, UniqueConstraint
from ..extensions import db


class SavedPlayer(db.Model):
    """
    A player shortlisted by a scout or institution (or any authenticated user).

    Generic model — works for any viewer role. Currently used by:
    - Scouts shortlisting players
    - Institutions shortlisting players
    """
    __tablename__ = 'saved_players'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Who saved the player
    user_id = db.Column(
        db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )
    # Who was saved (a player user)
    player_user_id = db.Column(
        db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )

    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    __table_args__ = (
        UniqueConstraint('user_id', 'player_user_id', name='uq_saved_player'),
        Index('idx_saved_players_user', 'user_id'),
        Index('idx_saved_players_player', 'player_user_id'),
    )

    # Two FKs point at users, so the relationship must say which one
    player_user = db.relationship('User', foreign_keys=[player_user_id])

    def to_dict(self):
        player = self.player_user
        profile = player.player_profile if player else None
        return {
            'id': self.id,
            'player_user_id': self.player_user_id,
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'player': {
                'id': profile.id,   # profile id, which /players/<id> expects
                'full_name': profile.full_name,
                'position': profile.position,
                'nationality': profile.nationality,
                'age': profile.age,
                'profile_picture_url': profile.profile_picture_url,
                'current_team': profile.current_team,
            } if profile else None,
        }