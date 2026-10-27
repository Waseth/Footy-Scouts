from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import Institution, Role, SavedPlayer, User
from ....services.cloudinary_service import CloudinaryService
from ....utils.decorators import role_required, get_current_user, get_optional_viewer
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.validators import (
    validate_file_extension, validate_file_size,
    ALLOWED_EXTENSIONS_IMAGE, MAX_IMAGE_SIZE,
)

institutions_bp = Blueprint('institutions', __name__)


def _viewer_can_see_contacts(viewer):
    if viewer is None:
        return False
    if getattr(viewer, 'is_premium', lambda: False)():
        return True
    role_name = getattr(viewer, 'role_name', None)
    if role_name in ('SCOUT', 'INSTITUTION'):
        return True
    return False


# ─────────────────────────────────────────────────────────────
#  Own profile
# ─────────────────────────────────────────────────────────────

@institutions_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required(Role.INSTITUTION)
def get_my_profile():
    user = get_current_user()
    if not user.institution_profile:
        return error_response("Institution profile not found", 404)
    return success_response(data={
        'institution': user.institution_profile.to_dict(
            viewer=user, viewer_is_authenticated=True, public=False,
        )
    })


@institutions_bp.route('/profile', methods=['POST'])
@jwt_required()
@role_required(Role.INSTITUTION)
def create_profile():
    user = get_current_user()
    if user.institution_profile:
        return error_response("Profile already exists. Use PUT to update.", 409)

    data = request.get_json() or {}
    institution_name = (data.get('institution_name') or '').strip()
    institution_type = (data.get('institution_type') or '').upper()

    if not institution_name:
        return error_response("Institution name is required", 400)
    if institution_type not in Institution.TYPES:
        return error_response(
            f"Invalid type. Choose: {', '.join(Institution.TYPES)}", 400,
        )

    institution = Institution(
        user_id=user.id,
        institution_name=institution_name,
        institution_type=institution_type,
        country=data.get('country'),
        city=data.get('city'),
        contact_number=data.get('contact_number'),
        description=data.get('description'),
    )
    db.session.add(institution)
    db.session.commit()

    return success_response(
        data={
            'institution': institution.to_dict(
                viewer=user, viewer_is_authenticated=True, public=False,
            ),
            'message': 'Profile created. Awaiting admin verification before becoming public.',
        },
        status_code=201,
    )


@institutions_bp.route('/profile', methods=['PUT'])
@jwt_required()
@role_required(Role.INSTITUTION)
def update_profile():
    user = get_current_user()
    institution = user.institution_profile
    if not institution:
        return error_response("Institution profile not found", 404)

    data = request.get_json() or {}
    updatable_fields = [
        'institution_name', 'institution_type', 'country', 'city',
        'contact_number', 'description',
    ]
    for field in updatable_fields:
        if field in data:
            setattr(institution, field, data[field])

    db.session.commit()
    return success_response(data={
        'institution': institution.to_dict(
            viewer=user, viewer_is_authenticated=True, public=False,
        )
    })


# ─────────────────────────────────────────────────────────────
#  Public fetch
# ─────────────────────────────────────────────────────────────

@institutions_bp.route('/<institution_id>', methods=['GET'])
def get_institution(institution_id):
    institution = Institution.query.filter_by(
        id=institution_id, is_verified=True,
    ).first()
    if not institution:
        return error_response("Institution not found or not yet verified", 404)

    viewer, is_authed = get_optional_viewer()
    return success_response(data={
        'institution': institution.to_dict(
            viewer=viewer, viewer_is_authenticated=is_authed, public=True,
        )
    })


@institutions_bp.route('', methods=['GET'])
def list_institutions():
    query = Institution.query.filter_by(is_verified=True)
    country = request.args.get('country')
    institution_type = request.args.get('type')
    if country:
        query = query.filter(Institution.country.ilike(f'%{country}%'))
    if institution_type:
        query = query.filter_by(institution_type=institution_type.upper())

    query = query.order_by(Institution.created_at.desc())
    viewer, is_authed = get_optional_viewer()
    result = paginate_query(
        query,
        schema_fn=lambda i: i.to_dict(
            viewer=viewer, viewer_is_authenticated=is_authed, public=True,
        ),
    )
    return success_response(data=result)


# ─────────────────────────────────────────────────────────────
#  Contact
# ─────────────────────────────────────────────────────────────

@institutions_bp.route('/<institution_id>/contact-info', methods=['GET'])
@jwt_required()
def institution_contact_info(institution_id):
    user = get_current_user()
    institution = Institution.query.filter_by(
        id=institution_id, is_verified=True,
    ).first()
    if not institution:
        return error_response("Institution not found or not yet verified", 404)

    is_owner = user.id == institution.user_id
    if not is_owner and not _viewer_can_see_contacts(user):
        return error_response(
            "Premium subscription required to contact institutions",
            403,
            errors={'code': 'SUBSCRIPTION_REQUIRED', 'reason': 'contact_institution'},
        )

    if not institution.contact_number:
        return error_response("This institution has not set a contact number yet", 404)

    return success_response(data={
        'contact_number': institution.contact_number,
        'email': institution.user.email if institution.user else None,
        'institution_name': institution.institution_name,
    })


# ─────────────────────────────────────────────────────────────
#  Shortlist
# ─────────────────────────────────────────────────────────────

@institutions_bp.route('/shortlist', methods=['GET'])
@jwt_required()
def list_shortlist():
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


@institutions_bp.route('/shortlist/<player_user_id>', methods=['POST'])
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


@institutions_bp.route('/shortlist/<player_user_id>', methods=['DELETE'])
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


@institutions_bp.route('/shortlist/check/<player_user_id>', methods=['GET'])
@jwt_required()
def check_shortlist(player_user_id):
    user = get_current_user()
    exists = SavedPlayer.query.filter_by(
        user_id=user.id, player_user_id=player_user_id,
    ).first() is not None
    return success_response(data={'saved': exists})


# ─────────────────────────────────────────────────────────────
#  Profile logo
# ─────────────────────────────────────────────────────────────

@institutions_bp.route('/profile/logo', methods=['POST'])
@jwt_required()
@role_required(Role.INSTITUTION)
@limiter.limit("10 per hour")
def upload_logo():
    user = get_current_user()
    institution = user.institution_profile
    if not institution:
        return error_response("Create a profile first", 404)

    if 'file' not in request.files:
        return error_response("No file provided", 400)

    file = request.files['file']
    if not validate_file_extension(file.filename, ALLOWED_EXTENSIONS_IMAGE):
        return error_response("Invalid file type", 400)
    if not validate_file_size(file.stream, MAX_IMAGE_SIZE):
        return error_response("File too large. Max 10MB.", 400)

    try:
        if institution.logo_public_id:
            CloudinaryService.delete_file(institution.logo_public_id)
        result = CloudinaryService.upload_image(file.stream, 'logo')
        institution.logo_url = result['secure_url']
        institution.logo_public_id = result['public_id']
        db.session.commit()
        return success_response(data={'logo_url': result['secure_url']})
    except Exception as e:
        return error_response(f"Upload failed: {str(e)}", 500)