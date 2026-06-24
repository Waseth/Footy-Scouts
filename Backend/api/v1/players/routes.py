from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, optional_jwt_required

from ....extensions import db, limiter
from ....models import Player, User, Role, MediaUpload
from ....services.cloudinary_service import CloudinaryService
from ....utils.decorators import role_required, get_current_user
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.validators import (validate_file_extension, validate_file_size,
                                   ALLOWED_EXTENSIONS_IMAGE, ALLOWED_EXTENSIONS_VIDEO,
                                   ALLOWED_EXTENSIONS_PDF, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, MAX_PDF_SIZE)

players_bp = Blueprint('players', __name__)


@players_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required(Role.PLAYER)
def get_my_profile():
    """Get the current player's own profile."""
    user = get_current_user()
    if not user.player_profile:
        return error_response("Player profile not found", 404)
    return success_response(data={'player': user.player_profile.to_dict(include_contact=True)})


@players_bp.route('/profile', methods=['POST'])
@jwt_required()
@role_required(Role.PLAYER)
def create_profile():
    """Create player profile (first time)."""
    user = get_current_user()
    if user.player_profile:
        return error_response("Profile already exists. Use PUT to update.", 409)

    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

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

    return success_response(data={'player': player.to_dict(include_contact=True)}, status_code=201)


@players_bp.route('/profile', methods=['PUT'])
@jwt_required()
@role_required(Role.PLAYER)
def update_profile():
    """Update player profile."""
    user = get_current_user()
    player = user.player_profile
    if not player:
        return error_response("Player profile not found. Create one first.", 404)

    data = request.get_json()
    updatable_fields = [
        'full_name', 'nationality', 'date_of_birth', 'gender', 'position',
        'current_team', 'school', 'contact_number', 'show_contact', 'biography'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(player, field, data[field])

    db.session.commit()
    return success_response(data={'player': player.to_dict(include_contact=True)})


@players_bp.route('/<player_id>', methods=['GET'])
def get_player(player_id):
    """Get a player's public profile. Contact info only visible if player is premium."""
    player = Player.query.get(player_id)
    if not player:
        return error_response("Player not found", 404)

    # Increment view count
    player.profile_views = (player.profile_views or 0) + 1
    db.session.commit()

    # Determine if viewer can see contact info
    # Contact visible if: player chose to show it AND player is premium
    include_contact = player.show_contact and player.user.is_premium()

    return success_response(data={'player': player.to_dict(include_contact=include_contact)})


@players_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
@role_required(Role.PLAYER)
@limiter.limit("10 per hour")
def upload_profile_picture():
    """Upload or replace player profile picture."""
    user = get_current_user()
    player = user.player_profile
    if not player:
        return error_response("Create a profile first", 404)

    if 'file' not in request.files:
        return error_response("No file provided", 400)

    file = request.files['file']
    if not file.filename:
        return error_response("No file selected", 400)

    if not validate_file_extension(file.filename, ALLOWED_EXTENSIONS_IMAGE):
        return error_response(f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS_IMAGE)}", 400)

    if not validate_file_size(file.stream, MAX_IMAGE_SIZE):
        return error_response("File too large. Maximum 10MB for images.", 400)

    try:
        # Delete old picture from Cloudinary if exists
        if player.profile_picture_public_id:
            CloudinaryService.delete_file(player.profile_picture_public_id)

        result = CloudinaryService.upload_image(file.stream, upload_type='profile_picture')
        player.profile_picture_url = result['secure_url']
        player.profile_picture_public_id = result['public_id']
        db.session.commit()

        return success_response(data={'profile_picture_url': result['secure_url']})
    except Exception as e:
        return error_response(f"Upload failed: {str(e)}", 500)


@players_bp.route('/media', methods=['POST'])
@jwt_required()
@role_required(Role.PLAYER)
@limiter.limit("20 per hour")
def upload_media():
    """Upload player media: image, video, or PDF CV."""
    user = get_current_user()
    player = user.player_profile
    if not player:
        return error_response("Create a profile first", 404)

    if 'file' not in request.files:
        return error_response("No file provided", 400)

    file = request.files['file']
    media_type = request.form.get('media_type', '').upper()  # IMAGE, VIDEO, PDF
    title = request.form.get('title', '')
    description = request.form.get('description', '')

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
@role_required(Role.PLAYER)
def get_my_media():
    """Get all media uploaded by the current player."""
    user = get_current_user()
    media = MediaUpload.query.filter_by(user_id=user.id).order_by(MediaUpload.created_at.desc()).all()
    return success_response(data={'media': [m.to_dict() for m in media]})


@players_bp.route('/<player_id>/media', methods=['GET'])
def get_player_media(player_id):
    """Get a player's approved media (public)."""
    player = Player.query.get(player_id)
    if not player:
        return error_response("Player not found", 404)

    media = MediaUpload.query.filter_by(
        user_id=player.user_id,
        is_approved=True
    ).order_by(MediaUpload.created_at.desc()).all()

    return success_response(data={'media': [m.to_dict() for m in media]})


@players_bp.route('/media/<media_id>', methods=['DELETE'])
@jwt_required()
@role_required(Role.PLAYER)
def delete_media(media_id):
    """Delete a media upload."""
    user = get_current_user()
    media = MediaUpload.query.filter_by(id=media_id, user_id=user.id).first()
    if not media:
        return error_response("Media not found", 404)

    try:
        resource_type = 'video' if media.media_type == 'VIDEO' else ('raw' if media.media_type == 'PDF' else 'image')
        CloudinaryService.delete_file(media.public_id, resource_type=resource_type)
    except Exception:
        pass  # Even if Cloudinary fails, remove from DB

    db.session.delete(media)
    db.session.commit()
    return success_response(message="Media deleted successfully")