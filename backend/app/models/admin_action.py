"""
AdminAction model — tracks every action an admin performs on the platform.
This lives separately from notifications (which are user-facing alerts).
AdminActions are an internal audit log for the admin dashboard.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class AdminAction(db.Model):
    __tablename__ = 'admin_actions'

    # ── Action type constants ──────────────────────────────────────────────────
    # Scout / Institution
    APPROVE_SCOUT        = 'APPROVE_SCOUT'
    REJECT_SCOUT         = 'REJECT_SCOUT'
    VERIFY_INSTITUTION   = 'VERIFY_INSTITUTION'
    REJECT_INSTITUTION   = 'REJECT_INSTITUTION'

    # User management
    SUSPEND_USER         = 'SUSPEND_USER'
    UNSUSPEND_USER       = 'UNSUSPEND_USER'
    DELETE_USER          = 'DELETE_USER'

    # Player
    FEATURE_PLAYER       = 'FEATURE_PLAYER'
    UNFEATURE_PLAYER     = 'UNFEATURE_PLAYER'

    # Media moderation
    APPROVE_MEDIA        = 'APPROVE_MEDIA'
    REJECT_MEDIA         = 'REJECT_MEDIA'

    # Tournament
    APPROVE_TOURNAMENT   = 'APPROVE_TOURNAMENT'
    CANCEL_TOURNAMENT    = 'CANCEL_TOURNAMENT'

    # Subscription
    GRANT_SUBSCRIPTION   = 'GRANT_SUBSCRIPTION'
    REVOKE_SUBSCRIPTION  = 'REVOKE_SUBSCRIPTION'

    # ── Target type constants ──────────────────────────────────────────────────
    TARGET_USER          = 'USER'
    TARGET_SCOUT         = 'SCOUT'
    TARGET_INSTITUTION   = 'INSTITUTION'
    TARGET_TOURNAMENT    = 'TOURNAMENT'
    TARGET_MEDIA         = 'MEDIA'
    TARGET_SUBSCRIPTION  = 'SUBSCRIPTION'

    # ── Columns ───────────────────────────────────────────────────────────────
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Who performed the action
    admin_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )

    # Who / what was acted upon
    target_user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    target_object_id = db.Column(db.String(36), nullable=True)   # e.g. tournament_id, media_id
    target_type = db.Column(db.String(50), nullable=False)        # TARGET_* constant

    # What happened
    action = db.Column(db.String(100), nullable=False)            # ACTION_* constant
    reason = db.Column(db.Text, nullable=True)                    # Admin-supplied reason
    notes  = db.Column(db.Text, nullable=True)                    # Internal notes

    # Snapshot of relevant data at time of action (JSON string)
    metadata_snapshot = db.Column(db.Text, nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    admin = db.relationship(
        'User',
        foreign_keys=[admin_id],
        backref='admin_actions_performed',
    )
    target_user = db.relationship(
        'User',
        foreign_keys=[target_user_id],
        backref='admin_actions_received',
    )

    __table_args__ = (
        Index('idx_admin_actions_admin_id',  'admin_id'),
        Index('idx_admin_actions_target',    'target_user_id'),
        Index('idx_admin_actions_action',    'action'),
        Index('idx_admin_actions_created',   'created_at'),
    )

    # ── Helpers ────────────────────────────────────────────────────────────────
    @classmethod
    def log(cls, admin_id, action, target_type,
            target_user_id=None, target_object_id=None,
            reason=None, notes=None, metadata_snapshot=None):
        """Convenience factory — creates and adds to session (caller must commit)."""
        entry = cls(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_user_id=target_user_id,
            target_object_id=target_object_id,
            reason=reason,
            notes=notes,
            metadata_snapshot=metadata_snapshot,
        )
        db.session.add(entry)
        return entry

    def to_dict(self):
        return {
            'id':               self.id,
            'admin_id':         self.admin_id,
            'target_user_id':   self.target_user_id,
            'target_object_id': self.target_object_id,
            'target_type':      self.target_type,
            'action':           self.action,
            'reason':           self.reason,
            'notes':            self.notes,
            'created_at':       self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<AdminAction {self.action} by {self.admin_id}>'