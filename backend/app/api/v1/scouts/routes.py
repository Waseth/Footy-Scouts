from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import Scout, SavedPlayer, User
from ....services.cloudinary_service import CloudinaryService
from ....utils.decorators import get_current_user, get_optional_viewer
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.validators import (
    validate_file_extension, validate_file_size,
    ALLOWED_EXTENSIONS_IMAGE, MAX_IMAGE_SIZE,
)

scouts_bp = Blueprint('scouts', __name__)


def _normalize_phone(raw: str) -> str:
    if not raw:
        return ''
    digits = ''.join(ch for ch in str(raw) if ch.isdigit())
    if digits.startswith('254') and len(digits) == 12:
        return '+' + digits
    if digits.startswith('0') and len(digits) == 10:
        return '+254' + digits[1:]
    if len(digits) == 9:
        return '+254' + digits
    if 7 <= len(digits) <= 15 and not digits.startswith('254'):
        return '+' + digits
    return ''


def _viewer_can_see_contacts(viewer):
    """
    Contact details are visible to:
      - Premium subscribers
      - Scouts (any scout can contact another scout — free)
      - Institutions (any institution can contact scouts — free)
    Free player accounts CANNOT see scout contacts.
    """
    if viewer is None:
        return False
    if getattr(viewer, 'is_premium', lambda: False)():
        return True
    role_name = getattr(viewer, 'role_name', None)
    if role_name in ('SCOUT', 'INSTITUTION'):
        return True
    return False


# ─────────────────────────────────────────────────────────────
#  Own profile — GET
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    user = get_current_user()
    if not user.scout_profile:
        return error_response("Scout profile not found", 404)
    return success_response(data={
        'scout': user.scout_profile.to_dict(
            viewer=user, viewer_is_authenticated=True, public=False,
        )
    })


# ─────────────────────────────────────────────────────────────
#  Own profile — POST (create only)
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_profile():
    user = get_current_user()
    if user.scout_profile:
        return error_response("Profile already exists. Use PUT to update.", 409)

    data = request.get_json() or {}
    scout_name = (data.get('scout_name') or '').strip()
    if not scout_name:
        return error_response("Scout name is required", 400)

    scout_type = (data.get('scout_type') or 'INDIVIDUAL').upper()
    if scout_type not in ('INDIVIDUAL', 'AGENCY'):
        return error_response("scout_type must be INDIVIDUAL or AGENCY", 400)
    if scout_type == 'AGENCY' and not (data.get('agency_name') or '').strip():
        return error_response("Agency name is required for agency scouts", 400)

    raw_phone = data.get('phone_number') or data.get('contact_number') or ''
    phone = _normalize_phone(raw_phone)
    if not phone:
        return error_response(
            "A valid phone number is required (e.g. 0712345678 or +254712345678)",
            400,
        )

    scout = Scout(
        user_id=user.id,
        scout_name=scout_name,
        scout_type=scout_type,
        agency_name=(data.get('agency_name') or None),
        country=data.get('country'),
        city=data.get('city'),
        contact_number=phone,
        phone_number=phone,
        biography=data.get('biography'),
    )
    db.session.add(scout)
    db.session.commit()

    return success_response(data={
        'scout': scout.to_dict(
            viewer=user, viewer_is_authenticated=True, public=False,
        ),
        'message': 'Profile created. Awaiting admin verification before becoming public.',
    }, status_code=201)


# ─────────────────────────────────────────────────────────────
#  Own profile — PUT (upsert)
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/profile', methods=['PUT'])
@jwt_required()
def upsert_profile():
    user = get_current_user()
    data = request.get_json() or {}

    if user.scout_profile:
        scout = user.scout_profile
        updatable = [
            'scout_name', 'agency_name', 'country', 'city',
            'biography', 'scout_type',
        ]
        if 'scout_type' in data:
            new_type = (data.get('scout_type') or '').upper()
            if new_type not in ('INDIVIDUAL', 'AGENCY'):
                return error_response("scout_type must be INDIVIDUAL or AGENCY", 400)
            data['scout_type'] = new_type

        raw_phone = data.get('phone_number') or data.get('contact_number')
        if raw_phone:
            phone = _normalize_phone(raw_phone)
            if not phone:
                return error_response("A valid phone number is required", 400)
            scout.phone_number = phone
            scout.contact_number = phone

        for field in updatable:
            if field in data:
                setattr(scout, field, data[field])

        if scout.scout_type == 'AGENCY' and not (scout.agency_name or '').strip():
            return error_response("Agency name is required for agency scouts", 400)

        db.session.commit()
        return success_response(data={
            'scout': scout.to_dict(
                viewer=user, viewer_is_authenticated=True, public=False,
            )
        })

    # Create branch
    scout_name = (data.get('scout_name') or '').strip()
    if not scout_name:
        return error_response("Scout name is required", 400)

    scout_type = (data.get('scout_type') or 'INDIVIDUAL').upper()
    if scout_type not in ('INDIVIDUAL', 'AGENCY'):
        return error_response("scout_type must be INDIVIDUAL or AGENCY", 400)
    if scout_type == 'AGENCY' and not (data.get('agency_name') or '').strip():
        return error_response("Agency name is required for agency scouts", 400)

    raw_phone = data.get('phone_number') or data.get('contact_number') or ''
    phone = _normalize_phone(raw_phone)
    if not phone:
        return error_response("A valid phone number is required", 400)

    scout = Scout(
        user_id=user.id,
        scout_name=scout_name,
        scout_type=scout_type,
        agency_name=(data.get('agency_name') or None),
        country=data.get('country'),
        city=data.get('city'),
        contact_number=phone,
        phone_number=phone,
        biography=data.get('biography'),
    )
    db.session.add(scout)
    db.session.commit()

    return success_response(data={
        'scout': scout.to_dict(
            viewer=user, viewer_is_authenticated=True, public=False,
        ),
        'message': 'Profile created. Awaiting admin verification before becoming public.',
    }, status_code=201)


# ─────────────────────────────────────────────────────────────
#  Public fetch
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/<scout_id>', methods=['GET'])
def get_scout(scout_id):
    scout = Scout.query.filter_by(id=scout_id, is_verified=True).first()
    if not scout:
        return error_response("Scout not found or not yet verified", 404)

    viewer, is_authed = get_optional_viewer()
    return success_response(data={
        'scout': scout.to_dict(
            viewer=viewer, viewer_is_authenticated=is_authed, public=True,
        )
    })


@scouts_bp.route('', methods=['GET'])
def list_scouts():
    query = Scout.query.filter_by(is_verified=True)
    country = request.args.get('country')
    scout_type = request.args.get('scout_type')
    if country:
        query = query.filter(Scout.country.ilike(f'%{country}%'))
    if scout_type:
        query = query.filter_by(scout_type=scout_type.upper())

    query = query.order_by(Scout.created_at.desc())
    viewer, is_authed = get_optional_viewer()
    result = paginate_query(
        query,
        schema_fn=lambda s: s.to_dict(
            viewer=viewer, viewer_is_authenticated=is_authed, public=True,
        ),
    )
    return success_response(data=result)


# ─────────────────────────────────────────────────────────────
#  Contact — free for scouts + institutions, premium for players
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/<scout_id>/contact-info', methods=['GET'])
@jwt_required()
def scout_contact_info(scout_id):
    user = get_current_user()
    scout = Scout.query.filter_by(id=scout_id, is_verified=True).first()
    if not scout:
        return error_response("Scout not found or not yet verified", 404)

    is_owner = user.id == scout.user_id
    if not is_owner and not _viewer_can_see_contacts(user):
        return error_response(
            "Premium subscription required to contact scouts",
            403,
            errors={'code': 'SUBSCRIPTION_REQUIRED', 'reason': 'contact_scout'},
        )

    if not scout.phone_number:
        return error_response("This scout has not set a phone number yet", 404)

    return success_response(data={
        'phone_number': scout.phone_number,
        'scout_name': scout.scout_name,
    })


# ─────────────────────────────────────────────────────────────
#  Shortlist (saved players)
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/shortlist', methods=['GET'])
@jwt_required()
def list_shortlist():
    """Return the current scout's shortlisted players."""
    user = get_current_user()
    rows = (
        SavedPlayer.query
        .filter_by(user_id=user.id)
        .order_by(SavedPlayer.created_at.desc())
        .all()
    )
    return success_response(data={
        'items': [r.to_dict() for r in rows],
        'total': len(rows),
    })


@scouts_bp.route('/shortlist/<player_user_id>', methods=['POST'])
@jwt_required()
def add_to_shortlist(player_user_id):
    user = get_current_user()

    if user.id == player_user_id:
        return error_response("You cannot shortlist yourself", 400)

    target = db.session.get(User, player_user_id)
    if not target:
        return error_response("Player not found", 404)
    if not target.player_profile:
        return error_response("That user is not a player", 400)

    existing = SavedPlayer.query.filter_by(
        user_id=user.id, player_user_id=player_user_id,
    ).first()
    if existing:
        return success_response(data={'item': existing.to_dict(), 'already_saved': True})

    data = request.get_json() or {}
    note = (data.get('note') or '').strip() or None

    row = SavedPlayer(
        user_id=user.id,
        player_user_id=player_user_id,
        note=note,
    )
    db.session.add(row)
    db.session.commit()

    return success_response(data={'item': row.to_dict()}, status_code=201)


@scouts_bp.route('/shortlist/<player_user_id>', methods=['DELETE'])
@jwt_required()
def remove_from_shortlist(player_user_id):
    user = get_current_user()
    row = SavedPlayer.query.filter_by(
        user_id=user.id, player_user_id=player_user_id,
    ).first()
    if not row:
        return error_response("Not in shortlist", 404)

    db.session.delete(row)
    db.session.commit()
    return success_response(message="Removed from shortlist")


@scouts_bp.route('/shortlist/check/<player_user_id>', methods=['GET'])
@jwt_required()
def check_shortlist(player_user_id):
    user = get_current_user()
    exists = SavedPlayer.query.filter_by(
        user_id=user.id, player_user_id=player_user_id,
    ).first() is not None
    return success_response(data={'saved': exists})


# ─────────────────────────────────────────────────────────────
#  Profile picture
# ─────────────────────────────────────────────────────────────

@scouts_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def upload_profile_picture():
    user = get_current_user()
    scout = user.scout_profile
    if not scout:
        return error_response("Create your scout profile first", 404)

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