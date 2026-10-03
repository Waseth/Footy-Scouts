import uuid
from datetime import datetime, timezone
import bcrypt
from sqlalchemy import Index
from ..extensions import db


class Role(db.Model):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    users = db.relationship('User', backref='role', lazy='dynamic')

    PLAYER = 'PLAYER'
    SCOUT = 'SCOUT'
    INSTITUTION = 'INSTITUTION'
    ADMIN = 'ADMIN'

    def __repr__(self):
        return f'<Role {self.name}>'

    def to_dict(self):
        return {'id': self.id, 'name': self.name}


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_suspended = db.Column(db.Boolean, default=False, nullable=False)
    is_approved = db.Column(db.Boolean, default=False, nullable=False)

    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime, nullable=True)

    subscription = db.relationship('Subscription', backref='user', uselist=False, lazy='joined')
    payments = db.relationship('Payment', backref='user', lazy='dynamic')
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy='dynamic')
    received_messages = db.relationship('Message', foreign_keys='Message.recipient_id', backref='recipient', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic')
    media_uploads = db.relationship('MediaUpload', backref='user', lazy='dynamic')

    __table_args__ = (
        Index('idx_users_email', 'email'),
        Index('idx_users_role_id', 'role_id'),
        Index('idx_users_is_active', 'is_active'),
    )

    # ── Auth ──
    def set_password(self, password: str):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    # ── Role helpers (legacy — kept for admin/back-compat) ──
    @property
    def role_name(self):
        return self.role.name if self.role else None

    def is_admin(self):
        return self.role_name == Role.ADMIN

    # ── Capability helpers (multi-capability aware) ──
    def has_player_capability(self):
        return getattr(self, 'player_profile', None) is not None

    def has_scout_capability(self):
        return getattr(self, 'scout_profile', None) is not None

    def has_institution_capability(self):
        return getattr(self, 'institution_profile', None) is not None

    def has_organizer_capability(self):
        return getattr(self, 'organizer_profile', None) is not None

    def capabilities(self):
        caps = []
        if self.has_player_capability():       caps.append('player')
        if self.has_scout_capability():        caps.append('scout')
        if self.has_institution_capability():  caps.append('institution')
        if self.has_organizer_capability():    caps.append('organizer')
        if self.is_admin():                    caps.append('admin')
        return caps

    # ── Subscription ──
    def has_active_subscription(self):
        if not self.subscription:
            return False
        return self.subscription.is_active()

    def is_premium(self):
        return self.has_active_subscription()

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self, include_capabilities=False):
        data = {
            'id': self.id,
            'email': self.email,
            'role': self.role_name,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'is_approved': self.is_approved,
            'is_suspended': self.is_suspended,
            'is_premium': self.is_premium(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }
        if include_capabilities:
            data['capabilities'] = self.capabilities()
        return data