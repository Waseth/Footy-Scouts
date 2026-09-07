from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import Institution, Role
from ....services.cloudinary_service import CloudinaryService
from ....utils.decorators import role_required, get_current_user
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.validators import validate_file_extension, validate_file_size, ALLOWED_EXTENSIONS_IMAGE, MAX_IMAGE_SIZE

institutions_bp = Blueprint('institutions', __name__)


@institutions_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required(Role.INSTITUTION)
def get_my_profile():
    user = get_current_user()
    if not user.institution_profile:
        return error_response("Institution profile not found", 404)
    return success_response(data={'institution': user.institution_profile.to_dict(public=False)})


@institutions_bp.route('/profile', methods=['POST'])
@jwt_required()
@role_required(Role.INSTITUTION)
def create_profile():
    user = get_current_user()
    if user.institution_profile:
        return error_response("Profile already exists. Use PUT to update.", 409)

    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    institution_name = data.get('institution_name', '').strip()
    institution_type = data.get('institution_type', '').upper()

    if not institution_name:
        return error_response("Institution name is required", 400)
    if institution_type not in Institution.TYPES:
        return error_response(f"Invalid type. Choose: {', '.join(Institution.TYPES)}", 400)

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
            'institution': institution.to_dict(public=False),
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

    data = request.get_json()
    updatable_fields = ['institution_name', 'institution_type', 'country', 'city', 'contact_number', 'description']
    for field in updatable_fields:
        if field in data:
            setattr(institution, field, data[field])

    db.session.commit()
    return success_response(data={'institution': institution.to_dict(public=False)})


@institutions_bp.route('/<institution_id>', methods=['GET'])
def get_institution(institution_id):
    """Public profile — only if verified."""
    institution = Institution.query.filter_by(id=institution_id, is_verified=True).first()
    if not institution:
        return error_response("Institution not found or not yet verified", 404)
    return success_response(data={'institution': institution.to_dict(public=True)})


@institutions_bp.route('', methods=['GET'])
def list_institutions():
    """List all verified institutions."""
    query = Institution.query.filter_by(is_verified=True)

    country = request.args.get('country')
    institution_type = request.args.get('type')
    if country:
        query = query.filter(Institution.country.ilike(f'%{country}%'))
    if institution_type:
        query = query.filter_by(institution_type=institution_type.upper())

    query = query.order_by(Institution.created_at.desc())
    result = paginate_query(query, schema_fn=lambda i: i.to_dict(public=True))
    return success_response(data=result)


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