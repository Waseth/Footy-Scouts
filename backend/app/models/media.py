import uuid
from datetime import datetime, timezone
from sqlalchemy import Index
from ..extensions import db


class MediaUpload(db.Model):
    __tablename__ = 'media_uploads'

    TYPE_IMAGE = 'IMAGE'
    TYPE_VIDEO = 'VIDEO'
    TYPE_PDF = 'PDF'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # File info
    media_type = db.Column(db.String(20), nullable=False)  # IMAGE, VIDEO, PDF
    title = db.Column(db.String(255))
    description = db.Column(db.Text)

    # Cloudinary info
    url = db.Column(db.String(500), nullable=False)
    public_id = db.Column(db.String(255), nullable=False)  # Cloudinary public_id for deletion
    secure_url = db.Column(db.String(500))

    # File metadata
    original_filename = db.Column(db.String(255))
    file_size = db.Column(db.Integer)  # bytes
    format = db.Column(db.String(20))  # jpg, mp4, pdf, etc.
    width = db.Column(db.Integer)   # for images/videos
    height = db.Column(db.Integer)  # for images/videos
    duration = db.Column(db.Float)  # for videos (seconds)

    # Moderation
    is_approved = db.Column(db.Boolean, default=True)  # Admin can disapprove
    moderation_note = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index('idx_media_uploads_user_id', 'user_id'),
        Index('idx_media_uploads_type', 'media_type'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'media_type': self.media_type,
            'title': self.title,
            'description': self.description,
            'url': self.secure_url or self.url,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'format': self.format,
            'width': self.width,
            'height': self.height,
            'duration': self.duration,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }