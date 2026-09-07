from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ....extensions import db
from ....models import Tournament, TournamentParticipant, User, Role
from ....utils.decorators import get_current_user
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.validators import validate_email, validate_phone, validate_date

tournaments_bp = Blueprint('tournaments', __name__)


@tournaments_bp.route('', methods=['GET'])
def list_tournaments():
    """List all approved tournaments (public)."""
    query = Tournament.query.filter_by(is_approved=True)

    # Filters
    tournament_type = request.args.get('type')
    status = request.args.get('status')
    location = request.args.get('location')

    if tournament_type:
        query = query.filter_by(tournament_type=tournament_type)
    if status:
        query = query.filter_by(status=status.upper())
    if location:
        query = query.filter(Tournament.location.ilike(f'%{location}%'))

    sort = request.args.get('sort', 'newest')
    if sort == 'newest':
        query = query.order_by(Tournament.created_at.desc())
    elif sort == 'start_date':
        query = query.order_by(Tournament.start_date.asc())

    result = paginate_query(query)
    return success_response(data=result)


@tournaments_bp.route('/<tournament_id>', methods=['GET'])
def get_tournament(tournament_id):
    """Get a single tournament's details."""
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)
    if not tournament.is_approved:
        return error_response("Tournament not yet approved", 404)
    return success_response(data={'tournament': tournament.to_dict()})


@tournaments_bp.route('', methods=['POST'])
@jwt_required()
def create_tournament():
    """
    Any authenticated user (or institution) can create a tournament.
    It requires admin approval before going public.
    """
    user = get_current_user()
    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    required = ['organization_name', 'representative_name', 'tournament_name', 'tournament_type']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 400)

    if data['tournament_type'] not in Tournament.TYPES:
        return error_response(f"tournament_type must be one of: {', '.join(Tournament.TYPES)}", 400)

    org_email = data.get('organization_email', '')
    if org_email and not validate_email(org_email):
        return error_response("Invalid organization email", 400)

    # Link to institution if the user is an institution
    institution_id = None
    if user.is_institution() and user.institution_profile:
        institution_id = user.institution_profile.id

    tournament = Tournament(
        organizer_user_id=user.id,
        institution_id=institution_id,
        organization_name=data['organization_name'],
        representative_name=data['representative_name'],
        organization_phone=data.get('organization_phone'),
        organization_email=org_email,
        representative_phone=data.get('representative_phone'),
        representative_email=data.get('representative_email'),
        tournament_name=data['tournament_name'],
        tournament_type=data['tournament_type'],
        location=data.get('location'),
        registration_fee=data.get('registration_fee', 0),
        fee_currency=data.get('fee_currency', 'KES'),
        description=data.get('description'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        registration_deadline=data.get('registration_deadline'),
    )
    db.session.add(tournament)
    db.session.commit()

    return success_response(
        data={
            'tournament': tournament.to_dict(),
            'message': 'Tournament submitted. Awaiting admin approval before going public.',
        },
        status_code=201,
    )


@tournaments_bp.route('/<tournament_id>', methods=['PUT'])
@jwt_required()
def update_tournament(tournament_id):
    """Update a tournament — only by its organizer, before it's approved."""
    user = get_current_user()
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)
    if tournament.organizer_user_id != user.id and not user.is_admin():
        return error_response("Not authorized", 403)

    data = request.get_json()
    editable = [
        'organization_name', 'representative_name', 'organization_phone',
        'organization_email', 'representative_phone', 'representative_email',
        'tournament_name', 'tournament_type', 'location', 'registration_fee',
        'fee_currency', 'description', 'start_date', 'end_date', 'registration_deadline',
    ]
    for field in editable:
        if field in data:
            setattr(tournament, field, data[field])

    db.session.commit()
    return success_response(data={'tournament': tournament.to_dict()})


@tournaments_bp.route('/<tournament_id>', methods=['DELETE'])
@jwt_required()
def delete_tournament(tournament_id):
    user = get_current_user()
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)
    if tournament.organizer_user_id != user.id and not user.is_admin():
        return error_response("Not authorized", 403)
    db.session.delete(tournament)
    db.session.commit()
    return success_response(message="Tournament deleted")


# ─────────────────────────────────────────────────────────────
#  PARTICIPANT REGISTRATION (no payment processing here)
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/<tournament_id>/register', methods=['POST'])
def register_participant(tournament_id):
    """Register as a participant. No payment processed here — pay organizer directly."""
    tournament = Tournament.query.get(tournament_id)
    if not tournament or not tournament.is_approved:
        return error_response("Tournament not found or not available", 404)

    if tournament.status not in [Tournament.STATUS_UPCOMING, Tournament.STATUS_ONGOING]:
        return error_response("Registration is closed for this tournament", 400)

    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    participant_type = data.get('participant_type', '').upper()
    if participant_type not in [TournamentParticipant.TYPE_INDIVIDUAL, TournamentParticipant.TYPE_TEAM]:
        return error_response("participant_type must be INDIVIDUAL or TEAM", 400)

    # Get user if logged in (optional)
    registered_by_user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        try:
            from flask_jwt_extended import decode_token
            token = auth_header.split(' ')[1]
            decoded = decode_token(token)
            registered_by_user_id = decoded.get('sub')
        except Exception:
            pass

    if participant_type == TournamentParticipant.TYPE_INDIVIDUAL:
        required = ['name', 'email', 'phone']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return error_response(f"Missing: {', '.join(missing)}", 400)

        participant = TournamentParticipant(
            tournament_id=tournament_id,
            registered_by_user_id=registered_by_user_id,
            participant_type=participant_type,
            name=data['name'],
            age=data.get('age'),
            email=data['email'],
            phone=data['phone'],
        )
    else:  # TEAM
        required = ['team_name', 'team_representative', 'email', 'phone']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return error_response(f"Missing: {', '.join(missing)}", 400)

        participant = TournamentParticipant(
            tournament_id=tournament_id,
            registered_by_user_id=registered_by_user_id,
            participant_type=participant_type,
            team_name=data['team_name'],
            team_representative=data['team_representative'],
            email=data['email'],
            phone=data['phone'],
        )

    db.session.add(participant)
    db.session.commit()

    return success_response(
        data={
            'participant': participant.to_dict(),
            'registration_fee': float(tournament.registration_fee or 0),
            'fee_currency': tournament.fee_currency,
            'payment_note': (
                f"Registration fee of {tournament.fee_currency} "
                f"{tournament.registration_fee or 0} is paid directly to the organizer. "
                f"Contact: {tournament.organization_email or tournament.organization_phone}"
            ),
        },
        status_code=201,
    )


@tournaments_bp.route('/<tournament_id>/participants', methods=['GET'])
@jwt_required()
def get_participants(tournament_id):
    """Get participant list — only organizer or admin."""
    user = get_current_user()
    tournament = Tournament.query.get(tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)
    if tournament.organizer_user_id != user.id and not user.is_admin():
        return error_response("Not authorized", 403)

    participants = TournamentParticipant.query.filter_by(tournament_id=tournament_id).all()
    return success_response(data={'participants': [p.to_dict() for p in participants]})


@tournaments_bp.route('/my', methods=['GET'])
@jwt_required()
def my_tournaments():
    """Get tournaments created by the current user."""
    user = get_current_user()
    query = Tournament.query.filter_by(organizer_user_id=user.id).order_by(Tournament.created_at.desc())
    result = paginate_query(query)
    return success_response(data=result)