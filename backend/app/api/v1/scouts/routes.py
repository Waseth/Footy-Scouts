from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import Scout, MediaUpload
from ....services.cloudinary_service import CloudinaryService
from ....utils.decorators import (
    capability_required, premium_required, get_current_user, get_optional_viewer,
)
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.validators import (
    validate_file_extension, validate_file_size,
    ALLOWED_EXTENSIONS_IMAGE, MAX_IMAGE_SIZE,
)

scouts_bp = Blueprint('scouts', __name__)


# ─────────────────────────────────────────────────────────────
#  Own profile (scout capability)
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/profile', methods=['GET'])
@jwt_required()
@capability_required('scout')
def get_my_profile():
    user = get_current_user()
    return success_response(data={
        'scout': user.scout_profile.to_dict(
            viewer=user, viewer_is_authenticated=True, public=False,
        )
    })


@scouts_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_profile():
    """
    Create scout profile. Any authenticated user can create one.
    No role gate — this is the multi-capability model.
    """
    user = get_current_user()
    if user.scout_profile:
        return error_response("Profile already exists. Use PUT to update.", 409)

    data = request.get_json() or {}
    scout_name = data.get('scout_name', '').strip()
    if not scout_name:
        return error_response("Scout name is required", 400)

    scout_type = data.get('scout_type', 'INDIVIDUAL').upper()
    if scout_type not in ['INDIVIDUAL', 'AGENCY']:
        return error_response("scout_type must be INDIVIDUAL or AGENCY", 400)

    scout = Scout(
        user_id=user.id,
        scout_name=scout_name,
        scout_type=scout_type,
        agency_name=data.get('agency_name'),
        country=data.get('country'),
        city=data.get('city'),
        contact_number=data.get('contact_number'),
        biography=data.get('biography'),
    )
    db.session.add(scout)
    db.session.commit()

    return success_response(data={
        'scout': scout.to_dict(viewer=user, viewer_is_authenticated=True, public=False),
        'message': 'Profile created. Awaiting admin verification before becoming public.',
    }, status_code=201)


@scouts_bp.route('/profile', methods=['PUT'])
@jwt_required()
@capability_required('scout')
def update_profile():
    user = get_current_user()
    scout = user.scout_profile

    data = request.get_json() or {}
    updatable = ['scout_name', 'agency_name', 'country', 'city', 'contact_number', 'biography', 'scout_type']
    for field in updatable:
        if field in data:
            setattr(scout, field, data[field])

    db.session.commit()
    return success_response(data={
        'scout': scout.to_dict(viewer=user, viewer_is_authenticated=True, public=False)
    })


# ─────────────────────────────────────────────────────────────
#  Public / viewer-aware fetch
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/<scout_id>', methods=['GET'])
def get_scout(scout_id):
    """Public scout profile (only if verified). Tiered visibility."""
    scout = Scout.query.filter_by(id=scout_id, is_verified=True).first()
    if not scout:
        return error_response("Scout not found or not yet verified", 404)

    viewer, is_authed = get_optional_viewer()
    return success_response(data={
        'scout': scout.to_dict(viewer=viewer, viewer_is_authenticated=is_authed, public=True)
    })


@scouts_bp.route('', methods=['GET'])
def list_scouts():
    """List all verified scouts (public)."""
    query = Scout.query.filter_by(is_verified=True)

    country = request.args.get('country')
    scout_type = request.args.get('scout_type')
    if country:
        query = query.filter(Scout.country.ilike(f'%{country}%'))
    if scout_type:
        query = query.filter_by(scout_type=scout_type.upper())

    query = query.order_by(Scout.created_at.desc())
    result = paginate_query(query, schema_fn=lambda s: s.to_dict(public=True))
    return success_response(data=result)


# ─────────────────────────────────────────────────────────────
#  Contact a scout (premium player action)
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/<scout_id>/contact', methods=['POST'])
@jwt_required()
@premium_required
def contact_scout(scout_id):
    """
    Premium players (and any premium user) can initiate contact with a scout.
    Returns the scout's contact info for now; can later route via messages.
    """
    scout = Scout.query.filter_by(id=scout_id, is_verified=True).first()
    if not scout:
        return error_response("Scout not found or not yet verified", 404)

    user = get_current_user()
    if user.id == scout.user_id:
        return error_response("You cannot contact yourself", 400)

    # Return contact info — alternative later: create a Message row instead.
    return success_response(data={
        'scout': {
            'id': scout.id,
            'scout_name': scout.scout_name,
            'contact_number': scout.contact_number,
            'email': scout.user.email if scout.user else None,
        },
        'message': 'Contact details revealed. Please reference Footy Scout when reaching out.',
    })


# ─────────────────────────────────────────────────────────────
#  Profile picture
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
@capability_required('scout')
@limiter.limit("10 per hour")
def upload_profile_picture():
    user = get_current_user()
    scout = user.scout_profile

    if 'file' not in request.files:
        return error_response("No file provided", 400)

    file = request.files['file']
    if not validate_file_extension(file.filename, ALLOWED_EXTENSIONS_IMAGE):
        return error_response("Invalid file type", 400)
    if not validate_file_size(file.stream, MAX_IMAGE_SIZE):
        return error_response("File too large. Max 10MB.", 400)

    try:
        if scout.profile_picture_public_id:
            CloudinaryService.delete_file(scout.profile_picture_public_id)
        result = CloudinaryService.upload_image(file.stream, 'profile_picture')
        scout.profile_picture_url = result['secure_url']
        scout.profile_picture_public_id = result['public_id']
        db.session.commit()
        return success_response(data={'profile_picture_url': result['secure_url']})
    except Exception as e:
        return error_response(f"Upload failed: {str(e)}", 500)