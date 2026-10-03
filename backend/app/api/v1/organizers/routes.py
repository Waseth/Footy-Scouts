from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db
from ....models import OrganizerProfile
from ....utils.decorators import capability_required, get_current_user
from ....utils.helpers import success_response, error_response

organizers_bp = Blueprint('organizers', __name__)


@organizers_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_organizer_profile():
    """Return the current user's organizer profile or 404."""
    user = get_current_user()
    if not user.organizer_profile:
        return error_response(
            "You do not have an organizer profile yet.",
            404,
            errors={'code': 'NO_ORGANIZER_PROFILE'},
        )
    return success_response(data={
        'organizer': user.organizer_profile.to_dict(public=False)
    })


@organizers_bp.route('', methods=['POST'])
@jwt_required()
def create_organizer_profile():
    """
    Become an organizer. Any authenticated user can call this.
    Creating the profile grants tournament-creation permissions.
    """
    user = get_current_user()
    if user.organizer_profile:
        return error_response("You already have an organizer profile.", 409)

    data = request.get_json() or {}
    display_name = (data.get('display_name') or '').strip()
    if not display_name:
        return error_response("display_name is required", 400)

    organizer = OrganizerProfile(
        user_id=user.id,
        display_name=display_name,
        organization_name=data.get('organization_name'),
        contact_email=data.get('contact_email') or user.email,
        contact_phone=data.get('contact_phone'),
        country=data.get('country'),
        city=data.get('city'),
        bio=data.get('bio'),
    )
    db.session.add(organizer)
    db.session.commit()

    return success_response(data={
        'organizer': organizer.to_dict(public=False),
        'message': 'Organizer profile created. You can now create tournaments.',
    }, status_code=201)


@organizers_bp.route('', methods=['PUT'])
@jwt_required()
@capability_required('organizer')
def update_organizer_profile():
    user = get_current_user()
    organizer = user.organizer_profile

    data = request.get_json() or {}
    editable = [
        'display_name', 'organization_name', 'contact_email', 'contact_phone',
        'country', 'city', 'bio',
    ]
    for field in editable:
        if field in data:
            setattr(organizer, field, data[field])

    db.session.commit()
    return success_response(data={'organizer': organizer.to_dict(public=False)})