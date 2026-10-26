import secrets
from datetime import datetime, timezone

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import (
    Tournament, TournamentTeam, Team, TeamMember,
    PlayerInvitation, PlayerJoinRequest, User, OrganizerProfile,
    OrganizerPayout, Notification, Payment,
)
from ....services.notification_service import NotificationService
from ....utils.decorators import get_current_user, get_optional_viewer
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.validators import validate_email, validate_phone

tournaments_bp = Blueprint('tournaments', __name__)


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def _get_commission_percent():
    from flask import current_app
    return float(current_app.config.get('PLATFORM_COMMISSION_PERCENT', 5.0))


def _generate_payout_code(prefix='PAYOUT'):
    return f"{prefix}-{secrets.token_hex(4).upper()}"


def _ensure_organizer_profile(user):
    if user.organizer_profile:
        return user.organizer_profile
    org = OrganizerProfile(
        user_id=user.id,
        display_name=user.email.split('@')[0] if user.email else 'Organizer',
        contact_email=user.email,
    )
    db.session.add(org)
    db.session.flush()
    return org


def _require_organizer(tournament, user):
    if tournament.organizer_user_id != user.id and not user.is_admin():
        return error_response("Only the organizer can manage this tournament", 403)
    return None


def _parse_date(raw):
    if not raw:
        return None
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, str):
        raw = raw.replace('Z', '+00:00')
        try:
            dt = datetime.fromisoformat(raw)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            pass
        try:
            dt = datetime.strptime(raw.split('T')[0], '%Y-%m-%d')
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _serialize_entry(entry, include_payment=False):
    """
    Serialize a TournamentTeam for the organizer/admin view.
    When include_payment=True, embed the linked Payment's key fields.
    """
    team = entry.team
    data = {
        'id': entry.id,
        'tournament_id': entry.tournament_id,
        'team_id': entry.team_id,
        'status': entry.status,
        'invited_by_organizer': entry.invited_by_organizer,
        'message': entry.message,
        'created_at': entry.created_at.isoformat() if entry.created_at else None,
        'responded_at': entry.responded_at.isoformat() if entry.responded_at else None,
        'registered_at': entry.registered_at.isoformat() if entry.registered_at else None,
        'entry_payment_id': entry.entry_payment_id,
        'team': {
            'id': team.id,
            'name': team.name,
            'logo_url': team.logo_url,
            'member_count': team.active_members_count() if team else 0,
            'captain_user_id': team.captain_user_id if team else None,
            'captain_email': team.captain.email if team and team.captain else None,
        } if team else None,
    }
    if include_payment and entry.entry_payment_id:
        p = db.session.get(Payment, entry.entry_payment_id)
        if p:
            data['payment'] = {
                'id': p.id,
                'amount': float(p.amount),
                'currency': p.currency,
                'status': p.status,
                'channel': p.paystack_channel,
                'reference': p.paystack_reference,
                'completed_at': p.completed_at.isoformat() if p.completed_at else None,
            }
    return data


# ─────────────────────────────────────────────────────────────
#  Public browsing
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('', methods=['GET'])
def list_tournaments():
    query = Tournament.query.filter(
        Tournament.status != Tournament.ST_DRAFT,
    )

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
    """Public — view tournament. Draft only visible to organizer/admin."""
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    viewer, is_authed = get_optional_viewer()
    is_owner = bool(viewer and viewer.id == tournament.organizer_user_id)
    is_admin = bool(viewer and viewer.is_admin())
    can_manage = is_owner or is_admin

    if tournament.status == Tournament.ST_DRAFT and not can_manage:
        return error_response("Tournament not found", 404)

    data = {'tournament': tournament.to_dict()}

    # Teams list — organizer/admin see every entry with payment details.
    # Public/captains see only REGISTERED entries.
    if can_manage:
        entries = tournament.tournament_teams.order_by(
            TournamentTeam.created_at.desc()
        ).all()
        data['teams'] = [_serialize_entry(e, include_payment=True) for e in entries]
    else:
        entries = tournament.tournament_teams.filter_by(
            status=TournamentTeam.STATUS_REGISTERED,
        ).all()
        data['teams'] = [_serialize_entry(e, include_payment=False) for e in entries]

    # Personal entry for captains of teams in this tournament
    data['my_team_entry'] = None
    if is_authed and viewer and not can_manage:
        captain_team_ids = [
            t.id for t in Team.query.filter_by(captain_user_id=viewer.id).all()
        ]
        if captain_team_ids:
            my_entry = (
                TournamentTeam.query
                .filter(
                    TournamentTeam.tournament_id == tournament.id,
                    TournamentTeam.team_id.in_(captain_team_ids),
                )
                .first()
            )
            if my_entry:
                squad = my_entry.team.active_members_count() if my_entry.team else 0
                can_pay = (
                    my_entry.status == TournamentTeam.STATUS_ACCEPTED
                    and squad >= tournament.min_players_per_team
                    and squad <= tournament.max_players_per_team
                )
                data['my_team_entry'] = {
                    'id': my_entry.id,
                    'team_id': my_entry.team_id,
                    'team_name': my_entry.team.name if my_entry.team else None,
                    'team_logo_url': my_entry.team.logo_url if my_entry.team else None,
                    'status': my_entry.status,
                    'squad_size': squad,
                    'min_players_per_team': tournament.min_players_per_team,
                    'max_players_per_team': tournament.max_players_per_team,
                    'team_entry_fee': float(tournament.team_entry_fee or 0),
                    'platform_fee_per_team': float(tournament.platform_fee_per_team or 0),
                    'fee_currency': tournament.fee_currency or 'KES',
                    'can_pay': can_pay,
                    'registered_at': my_entry.registered_at.isoformat() if my_entry.registered_at else None,
                }

    return success_response(data=data)


# ─────────────────────────────────────────────────────────────
#  Create / Edit (DRAFT state only)
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('', methods=['POST'])
@jwt_required()
def create_tournament():
    user = get_current_user()
    _ensure_organizer_profile(user)

    data = request.get_json() or {}

    required = [
        'tournament_name', 'tournament_type', 'organization_name',
        'representative_name', 'location',
        'required_teams', 'min_players_per_team', 'max_players_per_team',
        'team_entry_fee', 'start_date',
    ]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 400)

    if data['tournament_type'] not in Tournament.TYPES:
        return error_response(
            f"tournament_type must be one of: {', '.join(Tournament.TYPES)}", 400,
        )

    try:
        required_teams = int(data['required_teams'])
        min_players = int(data['min_players_per_team'])
        max_players = int(data['max_players_per_team'])
        team_entry_fee = float(data['team_entry_fee'])
    except (ValueError, TypeError):
        return error_response("Invalid numeric values for teams or fees", 400)

    if required_teams < 2 or required_teams > 128:
        return error_response("required_teams must be between 2 and 128", 400)
    if min_players < 1 or max_players < min_players:
        return error_response("Invalid min/max players per team", 400)
    if team_entry_fee < 0:
        return error_response("team_entry_fee cannot be negative", 400)

    commission_pct = _get_commission_percent()
    platform_fee_per_team = round(team_entry_fee * (commission_pct / 100.0), 2)
    tournament_fee_total = round(team_entry_fee * required_teams, 2)
    total_required_from_teams = round(
        (team_entry_fee + platform_fee_per_team) * required_teams, 2,
    )

    start_date = _parse_date(data.get('start_date'))
    end_date = _parse_date(data.get('end_date'))
    reg_deadline = _parse_date(data.get('registration_deadline'))

    if not start_date:
        return error_response("start_date is invalid", 400)

    tournament = Tournament(
        organizer_user_id=user.id,
        organization_name=data['organization_name'],
        representative_name=data['representative_name'],
        organization_phone=data.get('organization_phone'),
        organization_email=data.get('organization_email'),
        representative_phone=data.get('representative_phone'),
        representative_email=data.get('representative_email'),
        tournament_name=data['tournament_name'],
        tournament_type=data['tournament_type'],
        location=data['location'],
        description=data.get('description'),
        required_teams=required_teams,
        min_players_per_team=min_players,
        max_players_per_team=max_players,
        team_entry_fee=team_entry_fee,
        platform_fee_per_team=platform_fee_per_team,
        tournament_fee_total=tournament_fee_total,
        total_required_from_teams=total_required_from_teams,
        fee_currency=data.get('fee_currency', 'KES'),
        start_date=start_date,
        end_date=end_date,
        registration_deadline=reg_deadline,
        status=Tournament.ST_DRAFT,
    )
    db.session.add(tournament)
    db.session.commit()

    return success_response(
        data={'tournament': tournament.to_dict()},
        status_code=201,
    )


@tournaments_bp.route('/<tournament_id>', methods=['PUT'])
@jwt_required()
def update_tournament(tournament_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    if tournament.status != Tournament.ST_DRAFT:
        return error_response(
            "Only DRAFT tournaments can be edited", 400,
            errors={'code': 'NOT_DRAFT'},
        )

    data = request.get_json() or {}

    try:
        if 'required_teams' in data:
            tournament.required_teams = int(data['required_teams'])
        if 'team_entry_fee' in data:
            tournament.team_entry_fee = float(data['team_entry_fee'])
    except (ValueError, TypeError):
        return error_response("Invalid numeric values", 400)

    commission_pct = _get_commission_percent()
    tournament.platform_fee_per_team = round(
        float(tournament.team_entry_fee) * (commission_pct / 100.0), 2
    )
    tournament.tournament_fee_total = round(
        float(tournament.team_entry_fee) * tournament.required_teams, 2
    )
    tournament.total_required_from_teams = round(
        (float(tournament.team_entry_fee) + float(tournament.platform_fee_per_team))
        * tournament.required_teams, 2
    )

    for field in [
        'tournament_name', 'tournament_type', 'location', 'description',
        'organization_name', 'representative_name', 'organization_phone',
        'organization_email', 'representative_phone', 'representative_email',
    ]:
        if field in data:
            setattr(tournament, field, data[field])

    if 'start_date' in data:
        tournament.start_date = _parse_date(data['start_date'])
    if 'end_date' in data:
        tournament.end_date = _parse_date(data['end_date'])
    if 'registration_deadline' in data:
        tournament.registration_deadline = _parse_date(data['registration_deadline'])

    db.session.commit()
    return success_response(data={'tournament': tournament.to_dict()})


# ─────────────────────────────────────────────────────────────
#  Publish
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/<tournament_id>/publish', methods=['POST'])
@jwt_required()
def publish_tournament(tournament_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    if tournament.status != Tournament.ST_DRAFT:
        return error_response(
            "Only DRAFT tournaments can be published", 400,
            errors={'code': 'NOT_DRAFT'},
        )

    tournament.status = Tournament.ST_PUBLISHED
    tournament.published_at = datetime.now(timezone.utc)
    tournament.is_approved = True
    tournament.status = Tournament.ST_REGISTRATION_OPEN
    db.session.commit()

    return success_response(
        data={'tournament': tournament.to_dict()},
        message="Tournament published and open for registration.",
    )


# ─────────────────────────────────────────────────────────────
#  Cancel tournament
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/<tournament_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_tournament(tournament_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    if tournament.status in [Tournament.ST_COMPLETED, Tournament.ST_CANCELLED]:
        return error_response(
            f"Tournament is already {tournament.status}", 400,
        )

    for entry in tournament.tournament_teams.filter_by(
        status=TournamentTeam.STATUS_REGISTERED
    ).all():
        try:
            captain_id = entry.team.captain_user_id if entry.team else None
            if captain_id:
                NotificationService.create(
                    user_id=captain_id,
                    title="Tournament cancelled",
                    body=f"{tournament.tournament_name} has been cancelled. "
                         "Your team entry fee will be refunded within 5-7 business days.",
                    notification_type="TOURNAMENT",
                    related_id=tournament.id,
                    related_type="Tournament",
                )
        except Exception:
            pass

    tournament.status = Tournament.ST_CANCELLED
    tournament.payout_status = 'CANCELLED'
    db.session.commit()

    return success_response(
        data={'tournament': tournament.to_dict()},
        message="Tournament cancelled. Registered teams will be refunded.",
    )


# ─────────────────────────────────────────────────────────────
#  My tournaments (organizer)
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/my', methods=['GET'])
@jwt_required()
def my_tournaments():
    user = get_current_user()
    query = Tournament.query.filter_by(
        organizer_user_id=user.id
    ).order_by(Tournament.created_at.desc())
    result = paginate_query(query)
    return success_response(data=result)


# ─────────────────────────────────────────────────────────────
#  Invite a team (organizer → team)
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/<tournament_id>/invite-team', methods=['POST'])
@jwt_required()
@limiter.limit("50 per hour")
def invite_team(tournament_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    if tournament.status not in [
        Tournament.ST_REGISTRATION_OPEN, Tournament.ST_FILLING_TEAMS,
    ]:
        return error_response(
            "Registration is not open for this tournament", 400,
            errors={'code': 'NOT_OPEN'},
        )

    data = request.get_json() or {}
    team_id = data.get('team_id')
    if not team_id:
        return error_response("team_id is required", 400)

    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)

    existing = TournamentTeam.query.filter_by(
        tournament_id=tournament.id, team_id=team.id,
    ).first()
    if existing:
        return error_response(
            f"This team is already linked to the tournament (status: {existing.status})",
            409,
        )

    entry = TournamentTeam(
        tournament_id=tournament.id,
        team_id=team.id,
        status=TournamentTeam.STATUS_INVITED,
        invited_by_organizer=True,
    )
    db.session.add(entry)
    db.session.commit()

    try:
        NotificationService.create(
            user_id=team.captain_user_id,
            title="Tournament invitation",
            body=f"You've been invited to enter {team.name} into {tournament.tournament_name}.",
            notification_type="TOURNAMENT",
            related_id=team.id,
            related_type="Team",
        )
    except Exception:
        pass

    return success_response(
        data={'entry': entry.to_dict()},
        status_code=201,
        message="Team invited.",
    )


# ─────────────────────────────────────────────────────────────
#  Approve / Reject
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/<tournament_id>/teams/<entry_id>/approve', methods=['POST'])
@jwt_required()
def approve_team(tournament_id, entry_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    entry = TournamentTeam.query.filter_by(
        id=entry_id, tournament_id=tournament.id,
    ).first()
    if not entry:
        return error_response("Entry not found", 404)

    if entry.status != TournamentTeam.STATUS_JOIN_REQUESTED:
        return error_response(
            f"Cannot approve entry in {entry.status} status", 400,
        )

    occupied = TournamentTeam.query.filter(
        TournamentTeam.tournament_id == tournament.id,
        TournamentTeam.status.in_([
            TournamentTeam.STATUS_ACCEPTED,
            TournamentTeam.STATUS_REGISTERED,
        ]),
    ).count()

    if occupied >= tournament.required_teams:
        return error_response(
            "All team slots are already filled", 400,
            errors={'code': 'TOURNAMENT_FULL'},
        )

    entry.status = TournamentTeam.STATUS_ACCEPTED
    entry.responded_at = datetime.now(timezone.utc)

    if tournament.status == Tournament.ST_REGISTRATION_OPEN:
        tournament.status = Tournament.ST_FILLING_TEAMS

    db.session.commit()

    try:
        NotificationService.create(
            user_id=entry.team.captain_user_id,
            title="Join request approved",
            body=f"Your team {entry.team.name} is now accepted into {tournament.tournament_name}. "
                 "Build your squad to unlock payment.",
            notification_type="TOURNAMENT",
            related_id=entry.team.id,
            related_type="Team",
        )
    except Exception:
        pass

    return success_response(data={'entry': entry.to_dict()}, message="Team approved")


@tournaments_bp.route('/<tournament_id>/teams/<entry_id>/reject', methods=['POST'])
@jwt_required()
def reject_team(tournament_id, entry_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    entry = TournamentTeam.query.filter_by(
        id=entry_id, tournament_id=tournament.id,
    ).first()
    if not entry:
        return error_response("Entry not found", 404)

    if entry.status not in [
        TournamentTeam.STATUS_JOIN_REQUESTED,
        TournamentTeam.STATUS_INVITED,
    ]:
        return error_response(
            f"Cannot reject entry in {entry.status} status", 400,
        )

    entry.status = TournamentTeam.STATUS_REJECTED
    entry.responded_at = datetime.now(timezone.utc)
    db.session.commit()

    try:
        NotificationService.create(
            user_id=entry.team.captain_user_id,
            title="Tournament request declined",
            body=f"Your team {entry.team.name} was not accepted into {tournament.tournament_name}.",
            notification_type="TOURNAMENT",
            related_id=entry.team.id,
            related_type="Team",
        )
    except Exception:
        pass

    return success_response(message="Team rejected")


# ─────────────────────────────────────────────────────────────
#  Available teams for inviting
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/<tournament_id>/available-teams', methods=['GET'])
@jwt_required()
def available_teams_for_tournament(tournament_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    q = (request.args.get('q') or '').strip()

    existing_team_ids = [
        tt.team_id for tt in tournament.tournament_teams.all()
    ]

    query = Team.query
    if existing_team_ids:
        query = query.filter(~Team.id.in_(existing_team_ids))
    if q:
        query = query.filter(Team.name.ilike(f'%{q}%'))

    teams = query.order_by(Team.created_at.desc()).limit(30).all()

    return success_response(data={
        'teams': [t.to_dict(public=True) for t in teams],
    })


# ─────────────────────────────────────────────────────────────
#  Close registration → generate payout code
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/<tournament_id>/close-registration', methods=['POST'])
@jwt_required()
def close_registration(tournament_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    if tournament.status in [
        Tournament.ST_REGISTRATION_CLOSED,
        Tournament.ST_IN_PROGRESS,
        Tournament.ST_COMPLETED,
    ]:
        return error_response(
            f"Tournament is already {tournament.status}", 400,
        )

    registered = tournament.registered_teams_count()
    if registered < tournament.required_teams:
        return error_response(
            f"Cannot close registration: {registered}/{tournament.required_teams} teams registered",
            400,
            errors={
                'code': 'NOT_ENOUGH_TEAMS',
                'registered': registered,
                'required': tournament.required_teams,
                'missing': tournament.required_teams - registered,
            },
        )

    if not tournament.payout:
        payout_code = _generate_payout_code()
        gross = float(tournament.total_required_from_teams or 0)
        platform = float(tournament.platform_fee_per_team or 0) * tournament.required_teams
        net = float(tournament.tournament_fee_total or 0)

        payout = OrganizerPayout(
            tournament_id=tournament.id,
            organizer_user_id=user.id,
            payout_code=payout_code,
            gross_collected=gross,
            platform_fee=platform,
            net_to_organizer=net,
            status=OrganizerPayout.STATUS_PENDING,
        )
        db.session.add(payout)

        tournament.payout_code = payout_code
        tournament.payout_status = 'PENDING'
    else:
        payout = tournament.payout

    tournament.status = Tournament.ST_REGISTRATION_CLOSED
    tournament.registration_closed_at = datetime.now(timezone.utc)
    db.session.commit()

    return success_response(
        data={
            'tournament': tournament.to_dict(),
            'payout': payout.to_dict(),
        },
        message=f"Registration closed. Payout code: {tournament.payout_code}",
    )


# ─────────────────────────────────────────────────────────────
#  Payout status (organizer)
# ─────────────────────────────────────────────────────────────

@tournaments_bp.route('/<tournament_id>/payout', methods=['GET'])
@jwt_required()
def get_payout(tournament_id):
    user = get_current_user()
    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    err = _require_organizer(tournament, user)
    if err:
        return err

    payout = tournament.payout
    if not payout:
        return error_response(
            "No payout yet — close registration once all teams are paid", 404,
        )

    return success_response(data={'payout': payout.to_dict()})