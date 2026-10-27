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

    def to_dict(self):
        player = getattr(self, 'player_user', None)
        player_profile = getattr(player, 'player_profile', None) if player else None
        return {
            'id': self.id,
            'player_user_id': self.player_user_id,
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'player': {
                'full_name': player_profile.full_name if player_profile else None,
                'position': player_profile.position if player_profile else None,
                'nationality': player_profile.nationality if player_profile else None,
                'age': player_profile.age if player_profile else None,
                'profile_picture_url': player_profile.profile_picture_url if player_profile else None,
                'current_team': player_profile.current_team if player_profile else None,
            } if player_profile else None,
        }