from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import Player, MediaUpload
from ....services.cloudinary_service import CloudinaryService
from ....utils.decorators import get_current_user, get_optional_viewer
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.validators import (
    validate_file_extension, validate_file_size,
    ALLOWED_EXTENSIONS_IMAGE, ALLOWED_EXTENSIONS_VIDEO,
    ALLOWED_EXTENSIONS_PDF, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, MAX_PDF_SIZE,
)

players_bp = Blueprint('players', __name__)


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def _ensure_player_profile(user):
    """
    Return the user's Player profile, creating a minimal one if missing.
    Only call for users who can have a player profile (any authenticated
    user — per the multi-capability model).
    """
    player = user.player_profile
    if player:
        return player

    player = Player(
        user_id=user.id,
        full_name=(user.email.split('@')[0] if user.email else 'New Player'),
    )
    db.session.add(player)
    db.session.flush()
    return player


# ─────────────────────────────────────────────────────────────
#  Own profile
# ─────────────────────────────────────────────────────────────

@players_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    """
    Get the current user's player profile.
    Does not require a pre-existing profile — returns 404 if none.
    """
    user = get_current_user()
    if not user.player_profile:
        return error_response("Player profile not found", 404)
    return success_response(data={
        'player': user.player_profile.to_dict(
            viewer=user, viewer_is_authenticated=True, include_contact=True,
        )
    })


@players_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_profile():
    """
    Create player profile.
    Any authenticated user can create one — no role gate.
    """
    user = get_current_user()
    if user.player_profile:
        return error_response("Player profile already exists. Use PUT to update.", 409)

    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    if not full_name:
        return error_response("Full name is required", 400)

    player = Player(
        user_id=user.id,
        full_name=full_name,
        nationality=data.get('nationality'),
        date_of_birth=data.get('date_of_birth'),
        gender=data.get('gender'),
        position=data.get('position'),
        current_team=data.get('current_team'),
        school=data.get('school'),
        contact_number=data.get('contact_number'),
        show_contact=data.get('show_contact', False),
        biography=data.get('biography'),
    )
    db.session.add(player)
    db.session.commit()

    return success_response(data={
        'player': player.to_dict(viewer=user, viewer_is_authenticated=True, include_contact=True)
    }, status_code=201)


@players_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update player profile.
    Auto-creates a minimal profile if the user has none yet.
    """
    user = get_current_user()
    player = _ensure_player_profile(user)

    data = request.get_json() or {}
    updatable_fields = [
        'full_name', 'nationality', 'date_of_birth', 'gender', 'position',
        'current_team', 'school', 'contact_number', 'show_contact', 'biography',
    ]
    for field in updatable_fields:
        if field in data:
            setattr(player, field, data[field])

    db.session.commit()
    return success_response(data={
        'player': player.to_dict(viewer=user, viewer_is_authenticated=True, include_contact=True)
    })


# ─────────────────────────────────────────────────────────────
#  Public / viewer-aware profile fetch
# ─────────────────────────────────────────────────────────────

@players_bp.route('/<player_id>', methods=['GET'])
def get_player(player_id):
    """
    Fetch a player's profile with tiered visibility.
    - Guest: basic public info.
    - Registered user: + age, gender, DOB, school.
    - Owner: + contact info.
    """
    player = db.session.get(Player, player_id)
    if not player:
        return error_response("Player not found", 404)

    viewer, is_authed = get_optional_viewer()
    is_owner = bool(viewer and viewer.id == player.user_id)
    if not is_owner:
        player.profile_views = (player.profile_views or 0) + 1
        db.session.commit()

    return success_response(data={
        'player': player.to_dict(viewer=viewer, viewer_is_authenticated=is_authed)
    })


# ─────────────────────────────────────────────────────────────
#  Profile picture
# ─────────────────────────────────────────────────────────────

@players_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def upload_profile_picture():
    """
    Upload or replace player profile picture.
    Auto-creates a minimal profile if missing so first-time users
    can upload without completing onboarding first.
    """
    user = get_current_user()
    player = _ensure_player_profile(user)

    if 'file' not in request.files:
        return error_response("No file provided", 400)

    file = request.files['file']
    if not file.filename:
        return error_response("No file selected", 400)

    if not validate_file_extension(file.filename, ALLOWED_EXTENSIONS_IMAGE):
        return error_response(
            f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS_IMAGE)}",
            400,
        )
    if not validate_file_size(file.stream, MAX_IMAGE_SIZE):
        return error_response("File too large. Maximum 10MB for images.", 400)

    try:
        if player.profile_picture_public_id:
            try:
                CloudinaryService.delete_file(player.profile_picture_public_id)
            except Exception:
                pass  # don't fail if old delete fails
        result = CloudinaryService.upload_image(file.stream, upload_type='profile_picture')
        player.profile_picture_url = result['secure_url']
        player.profile_picture_public_id = result['public_id']
        db.session.commit()
        return success_response(data={'profile_picture_url': result['secure_url']})
    except Exception as e:
        db.session.rollback()
        return error_response(f"Upload failed: {str(e)}", 500)


# ─────────────────────────────────────────────────────────────
#  Media (highlights) — VIDEO requires premium
# ─────────────────────────────────────────────────────────────

@players_bp.route('/media', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def upload_media():
    """
    Upload player media: image, video, or PDF CV.
    VIDEO uploads require premium subscription.
    Auto-creates a minimal profile if missing.
    """
    user = get_current_user()
    player = _ensure_player_profile(user)

    if 'file' not in request.files:
        return error_response("No file provided", 400)

    file = request.files['file']
    media_type = request.form.get('media_type', '').upper()
    title = request.form.get('title', '')
    description = request.form.get('description', '')

    if media_type == 'VIDEO' and not user.is_premium():
        return error_response(
            "Uploading video highlights requires a premium subscription.",
            403,
            errors={'code': 'PREMIUM_REQUIRED', 'reason': 'upload_highlights'},
        )

    if media_type == 'IMAGE':
        if not validate_file_extension(file.filename, ALLOWED_EXTENSIONS_IMAGE):
            return error_response("Invalid image format", 400)
        if not validate_file_size(file.stream, MAX_IMAGE_SIZE):
            return error_response("Image too large. Max 10MB.", 400)
        result = CloudinaryService.upload_image(file.stream, 'player_photo')
    elif media_type == 'VIDEO':
        if not validate_file_extension(file.filename, ALLOWED_EXTENSIONS_VIDEO):
            return error_response("Invalid video format", 400)
        if not validate_file_size(file.stream, MAX_VIDEO_SIZE):
            return error_response("Video too large. Max 500MB.", 400)
        result = CloudinaryService.upload_video(file.stream, 'player_video')
    elif media_type == 'PDF':
        if not validate_file_extension(file.filename, {'pdf'}):
            return error_response("Only PDF files allowed", 400)
        if not validate_file_size(file.stream, MAX_PDF_SIZE):
            return error_response("PDF too large. Max 20MB.", 400)
        result = CloudinaryService.upload_raw(file.stream, 'player_cv')
    else:
        return error_response("media_type must be IMAGE, VIDEO, or PDF", 400)

    media = MediaUpload(
        user_id=user.id,
        media_type=media_type,
        title=title,
        description=description,
        url=result.get('url'),
        secure_url=result.get('secure_url'),
        public_id=result['public_id'],
        original_filename=result.get('original_filename'),
        file_size=result.get('file_size'),
        format=result.get('format'),
        width=result.get('width'),
        height=result.get('height'),
        duration=result.get('duration'),
    )
    db.session.add(media)
    db.session.commit()

    return success_response(data={'media': media.to_dict()}, status_code=201)


@players_bp.route('/media', methods=['GET'])
@jwt_required()
def get_my_media():
    """Get all media uploaded by the current user."""
    user = get_current_user()
    media = (
        MediaUpload.query
        .filter_by(user_id=user.id)
        .order_by(MediaUpload.created_at.desc())
        .all()
    )
    return success_response(data={'media': [m.to_dict() for m in media]})


@players_bp.route('/<player_id>/media', methods=['GET'])
def get_player_media(player_id):
    """
    Public: returns media list for a player.
    Guests get an empty list + requires_login flag so the frontend
    can prompt them to log in.
    """
    player = db.session.get(Player, player_id)
    if not player:
        return error_response("Player not found", 404)

    viewer, is_authed = get_optional_viewer()

    if not is_authed:
        return success_response(data={
            'media': [],
            'requires_login': True,
            'message': 'Log in to view video highlights and additional media.',
        })

    media = (
        MediaUpload.query
        .filter_by(user_id=player.user_id, is_approved=True)
        .order_by(MediaUpload.created_at.desc())
        .all()
    )

    return success_response(data={'media': [m.to_dict() for m in media]})


@players_bp.route('/media/<media_id>', methods=['DELETE'])
@jwt_required()
def delete_media(media_id):
    """Delete a media upload owned by the current user."""
    user = get_current_user()
    media = MediaUpload.query.filter_by(id=media_id, user_id=user.id).first()
    if not media:
        return error_response("Media not found", 404)

    try:
        resource_type = (
            'video' if media.media_type == 'VIDEO'
            else ('raw' if media.media_type == 'PDF' else 'image')
        )
        CloudinaryService.delete_file(media.public_id, resource_type=resource_type)
    except Exception:
        pass

    db.session.delete(media)
    db.session.commit()
    return success_response(message="Media deleted successfully")