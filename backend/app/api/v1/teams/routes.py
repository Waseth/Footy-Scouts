import uuid
from datetime import datetime, timezone

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db, limiter
from ....models import (
    Team, TeamMember, PlayerInvitation, PlayerJoinRequest, User, Role, Player,
    TournamentTeam,
)
from ....services.cloudinary_service import CloudinaryService
from ....services.notification_service import NotificationService
from ....utils.decorators import get_current_user
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query
from ....utils.tournament_conflicts import (
    find_player_tournament_conflict, find_team_conflict,
)
from ....utils.validators import (
    validate_file_extension, validate_file_size,
    ALLOWED_EXTENSIONS_IMAGE, MAX_IMAGE_SIZE,
)

teams_bp = Blueprint('teams', __name__)


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def _captain_or_403(team, user):
    if team.captain_user_id != user.id:
        return error_response("Only the team captain can do this", 403)
    return None


def _has_active_tournament_entries(team):
    active_statuses = [
        TournamentTeam.STATUS_INVITED,
        TournamentTeam.STATUS_JOIN_REQUESTED,
        TournamentTeam.STATUS_ACCEPTED,
        TournamentTeam.STATUS_REGISTERED,
    ]
    return TournamentTeam.query.filter(
        TournamentTeam.team_id == team.id,
        TournamentTeam.status.in_(active_statuses),
    ).count() > 0


def _team_locked_by_registration(team):
    return TournamentTeam.query.filter(
        TournamentTeam.team_id == team.id,
        TournamentTeam.status == TournamentTeam.STATUS_REGISTERED,
    ).count() > 0


def _ensure_player_profile(user):
    if user.player_profile:
        return user.player_profile, None
    if user.role_name != Role.PLAYER:
        return None, error_response(
            "You must have a player profile to use this feature",
            403,
            errors={'code': 'PLAYER_PROFILE_REQUIRED'},
        )
    player = Player(
        user_id=user.id,
        full_name=(user.email.split('@')[0] if user.email else 'New Player'),
    )
    db.session.add(player)
    db.session.flush()
    return player, None


# ─────────────────────────────────────────────────────────────
#  Team CRUD
# ─────────────────────────────────────────────────────────────

@teams_bp.route('', methods=['POST'])
@jwt_required()
def create_team():
    user = get_current_user()
    player, err = _ensure_player_profile(user)
    if err:
        return err

    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return error_response("Team name is required", 400)
    if len(name) > 255:
        return error_response("Team name is too long", 400)

    team = Team(
        captain_user_id=user.id,
        name=name,
        description=(data.get('description') or '').strip() or None,
    )
    db.session.add(team)
    db.session.flush()
    db.session.add(TeamMember(
        team_id=team.id,
        user_id=user.id,
        status=TeamMember.STATUS_ACTIVE,
    ))
    db.session.commit()
    return success_response(data={'team': team.to_dict(public=False)}, status_code=201)


@teams_bp.route('/my', methods=['GET'])
@jwt_required()
def my_teams():
    user = get_current_user()
    query = Team.query.filter_by(captain_user_id=user.id).order_by(Team.created_at.desc())
    result = paginate_query(query, schema_fn=lambda t: t.to_dict(public=False))
    return success_response(data=result)


@teams_bp.route('/available', methods=['GET'])
@jwt_required()
def available_teams():
    user = get_current_user()
    query = Team.query.filter(Team.captain_user_id != user.id).order_by(Team.created_at.desc())
    result = paginate_query(query, schema_fn=lambda t: t.to_dict(public=True))
    return success_response(data=result)


@teams_bp.route('/<team_id>', methods=['GET'])
@jwt_required()
def get_team(team_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)

    is_captain = team.captain_user_id == user.id
    data = {
        'team': team.to_dict(public=not is_captain),
        'members': [m.to_dict() for m in team.active_members()],
        'is_captain': is_captain,
    }

    if is_captain:
        requests = PlayerJoinRequest.query.filter_by(
            team_id=team.id, status=PlayerJoinRequest.STATUS_PENDING,
        ).order_by(PlayerJoinRequest.created_at.desc()).all()
        data['join_requests'] = [r.to_dict() for r in requests]

        invites = PlayerInvitation.query.filter_by(
            team_id=team.id, status=PlayerInvitation.STATUS_PENDING,
        ).order_by(PlayerInvitation.created_at.desc()).all()
        data['sent_invitations'] = [i.to_dict() for i in invites]

        tournament_invs = TournamentTeam.query.filter_by(
            team_id=team.id,
            status=TournamentTeam.STATUS_INVITED,
        ).order_by(TournamentTeam.created_at.desc()).all()

        data['tournament_invitations'] = [
            {
                'id': t.id,
                'tournament_id': t.tournament_id,
                'tournament_name': t.tournament.tournament_name if t.tournament else None,
                'tournament_type': t.tournament.tournament_type if t.tournament else None,
                'location': t.tournament.location if t.tournament else None,
                'start_date': (
                    t.tournament.start_date.isoformat()
                    if t.tournament and t.tournament.start_date else None
                ),
                'end_date': (
                    t.tournament.end_date.isoformat()
                    if t.tournament and t.tournament.end_date else None
                ),
                'min_players_per_team': t.tournament.min_players_per_team if t.tournament else 0,
                'max_players_per_team': t.tournament.max_players_per_team if t.tournament else 0,
                'team_entry_fee': float(t.tournament.team_entry_fee) if t.tournament else 0,
                'fee_currency': t.tournament.fee_currency if t.tournament else 'KES',
                'created_at': t.created_at.isoformat() if t.created_at else None,
            }
            for t in tournament_invs
        ]

    return success_response(data=data)


@teams_bp.route('/<team_id>', methods=['PUT'])
@jwt_required()
def update_team(team_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err

    data = request.get_json() or {}
    if 'name' in data:
        name = (data.get('name') or '').strip()
        if not name:
            return error_response("Team name cannot be empty", 400)
        team.name = name[:255]
    if 'description' in data:
        team.description = (data.get('description') or '').strip() or None
    db.session.commit()
    return success_response(data={'team': team.to_dict(public=False)})


@teams_bp.route('/<team_id>', methods=['DELETE'])
@jwt_required()
def delete_team(team_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err
    if _has_active_tournament_entries(team):
        return error_response(
            "Cannot delete a team with active tournament entries",
            400,
            errors={'code': 'TEAM_IN_USE'},
        )
    db.session.delete(team)
    db.session.commit()
    return success_response(message="Team deleted")


# ─────────────────────────────────────────────────────────────
#  Team logo
# ─────────────────────────────────────────────────────────────

@teams_bp.route('/<team_id>/logo', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def upload_team_logo(team_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err
    if 'file' not in request.files:
        return error_response("No file provided", 400)
    file = request.files['file']
    if not file.filename:
        return error_response("No file selected", 400)
    if not validate_file_extension(file.filename, ALLOWED_EXTENSIONS_IMAGE):
        return error_response("Invalid image format", 400)
    if not validate_file_size(file.stream, MAX_IMAGE_SIZE):
        return error_response("File too large. Max 10MB.", 400)
    try:
        if team.logo_public_id:
            try:
                CloudinaryService.delete_file(team.logo_public_id)
            except Exception:
                pass
        result = CloudinaryService.upload_image(file.stream, 'logo')
        team.logo_url = result['secure_url']
        team.logo_public_id = result['public_id']
        db.session.commit()
        return success_response(data={'logo_url': result['secure_url']})
    except Exception as e:
        db.session.rollback()
        return error_response(f"Upload failed: {str(e)}", 500)


# ─────────────────────────────────────────────────────────────
#  Squad management
# ─────────────────────────────────────────────────────────────

@teams_bp.route('/<team_id>/members', methods=['GET'])
@jwt_required()
def list_members(team_id):
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    return success_response(data={
        'members': [m.to_dict() for m in team.active_members()],
        'member_count': team.active_members_count(),
    })


@teams_bp.route('/<team_id>/members/<member_id>', methods=['DELETE'])
@jwt_required()
def remove_member(team_id, member_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err
    if _team_locked_by_registration(team):
        return error_response(
            "Squad is locked after tournament registration",
            400,
            errors={'code': 'SQUAD_LOCKED'},
        )
    member = TeamMember.query.filter_by(id=member_id, team_id=team.id).first()
    if not member:
        return error_response("Member not found", 404)
    if member.user_id == team.captain_user_id:
        return error_response("Captain cannot be removed from the team", 400)
    member.status = TeamMember.STATUS_REMOVED
    member.removed_at = datetime.now(timezone.utc)
    db.session.commit()
    return success_response(message="Player removed from team")


@teams_bp.route('/<team_id>/leave', methods=['POST'])
@jwt_required()
def leave_team(team_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    if team.captain_user_id == user.id:
        return error_response(
            "Captain cannot leave the team. Delete it or transfer captaincy first.",
            400,
        )
    if _team_locked_by_registration(team):
        return error_response(
            "You cannot leave a team that's registered for a tournament",
            400,
            errors={'code': 'SQUAD_LOCKED'},
        )
    member = TeamMember.query.filter_by(
        team_id=team.id, user_id=user.id, status=TeamMember.STATUS_ACTIVE,
    ).first()
    if not member:
        return error_response("You're not a member of this team", 404)
    member.status = TeamMember.STATUS_REMOVED
    member.removed_at = datetime.now(timezone.utc)
    db.session.commit()
    return success_response(message="You left the team")


# ─────────────────────────────────────────────────────────────
#  Captain invites players
# ─────────────────────────────────────────────────────────────

@teams_bp.route('/<team_id>/invite-player', methods=['POST'])
@jwt_required()
@limiter.limit("50 per hour")
def invite_player(team_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err

    data = request.get_json() or {}
    player_user_id = data.get('user_id')
    message = (data.get('message') or '').strip() or None
    if not player_user_id:
        return error_response("user_id is required", 400)

    target = db.session.get(User, player_user_id)
    if not target:
        return error_response("Player not found", 404)
    if not target.player_profile:
        return error_response("That user does not have a player profile", 400)
    if target.id == user.id:
        return error_response("You're already on the team as captain", 400)

    existing_member = TeamMember.query.filter_by(
        team_id=team.id, user_id=target.id, status=TeamMember.STATUS_ACTIVE,
    ).first()
    if existing_member:
        return error_response("That player is already on the team", 409)

    pending = PlayerInvitation.query.filter_by(
        team_id=team.id, invited_user_id=target.id,
        status=PlayerInvitation.STATUS_PENDING,
    ).first()
    if pending:
        return error_response("A pending invitation already exists", 409)

    invite = PlayerInvitation(
        team_id=team.id,
        invited_user_id=target.id,
        invited_by_user_id=user.id,
        message=message,
        status=PlayerInvitation.STATUS_PENDING,
    )
    db.session.add(invite)
    db.session.commit()

    captain_name = user.player_profile.full_name if user.player_profile else user.email
    try:
        NotificationService.notify_player_invited(
            player_user_id=target.id,
            team_name=team.name,
            captain_name=captain_name,
            team_id=team.id,
        )
    except Exception:
        pass
    return success_response(data={'invitation': invite.to_dict()}, status_code=201)


@teams_bp.route('/<team_id>/invitations/<invite_id>', methods=['DELETE'])
@jwt_required()
def cancel_invitation(team_id, invite_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err
    invite = PlayerInvitation.query.filter_by(
        id=invite_id, team_id=team.id, status=PlayerInvitation.STATUS_PENDING,
    ).first()
    if not invite:
        return error_response("Invitation not found", 404)
    invite.status = PlayerInvitation.STATUS_CANCELLED
    invite.responded_at = datetime.now(timezone.utc)
    db.session.commit()
    return success_response(message="Invitation cancelled")


# ─────────────────────────────────────────────────────────────
#  Captain handles join requests — WITH tournament overlap check
# ─────────────────────────────────────────────────────────────

@teams_bp.route('/<team_id>/join-requests', methods=['GET'])
@jwt_required()
def list_join_requests(team_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err
    requests = PlayerJoinRequest.query.filter_by(
        team_id=team.id, status=PlayerJoinRequest.STATUS_PENDING,
    ).order_by(PlayerJoinRequest.created_at.desc()).all()
    return success_response(data={'requests': [r.to_dict() for r in requests]})


@teams_bp.route('/<team_id>/join-requests/<request_id>/accept', methods=['POST'])
@jwt_required()
def accept_join_request(team_id, request_id):
    """
    Captain accepts a player's request to join the team.
    If the team is already ACCEPTED or REGISTERED in a tournament,
    check that the player isn't in another overlapping tournament.
    """
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err

    req = PlayerJoinRequest.query.filter_by(
        id=request_id, team_id=team.id, status=PlayerJoinRequest.STATUS_PENDING,
    ).first()
    if not req:
        return error_response("Request not found", 404)

    target = db.session.get(User, req.user_id)
    if not target or not target.player_profile:
        return error_response("Player no longer has a player profile", 400)

    existing = TeamMember.query.filter_by(
        team_id=team.id, user_id=target.id, status=TeamMember.STATUS_ACTIVE,
    ).first()
    if existing:
        req.status = PlayerJoinRequest.STATUS_ACCEPTED
        req.responded_at = datetime.now(timezone.utc)
        db.session.commit()
        return error_response("Player is already on the team", 409)

    # 🆕 Tournament overlap check
    # If this team is in a tournament (ACCEPTED or REGISTERED), ensure the
    # player isn't already on another team in an overlapping tournament.
    active_entries = TournamentTeam.query.filter(
        TournamentTeam.team_id == team.id,
        TournamentTeam.status.in_([
            TournamentTeam.STATUS_ACCEPTED,
            TournamentTeam.STATUS_REGISTERED,
        ]),
    ).all()

    for entry in active_entries:
        conflict = find_player_tournament_conflict(target.id, entry.tournament)
        if conflict:
            return error_response(
                f"{target.player_profile.full_name} is already committed to "
                f"another tournament that overlaps with {entry.tournament.tournament_name} "
                f"({conflict.tournament_name}).",
                409,
                errors={
                    'code': 'TOURNAMENT_DATE_CONFLICT',
                    'conflict_tournament': conflict.tournament_name,
                    'target_tournament': entry.tournament.tournament_name,
                },
            )

    db.session.add(TeamMember(
        team_id=team.id,
        user_id=target.id,
        status=TeamMember.STATUS_ACTIVE,
    ))
    req.status = PlayerJoinRequest.STATUS_ACCEPTED
    req.responded_at = datetime.now(timezone.utc)
    db.session.commit()

    try:
        NotificationService.notify_join_request_approved(
            player_user_id=target.id, team_name=team.name, team_id=team.id,
        )
    except Exception:
        pass
    return success_response(message="Player added to team")


@teams_bp.route('/<team_id>/join-requests/<request_id>/reject', methods=['POST'])
@jwt_required()
def reject_join_request(team_id, request_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err
    req = PlayerJoinRequest.query.filter_by(
        id=request_id, team_id=team.id, status=PlayerJoinRequest.STATUS_PENDING,
    ).first()
    if not req:
        return error_response("Request not found", 404)
    req.status = PlayerJoinRequest.STATUS_REJECTED
    req.responded_at = datetime.now(timezone.utc)
    db.session.commit()
    try:
        NotificationService.notify_join_request_rejected(
            player_user_id=req.user_id, team_name=team.name, team_id=team.id,
        )
    except Exception:
        pass
    return success_response(message="Request rejected")


# ─────────────────────────────────────────────────────────────
#  Player requests to join a team
# ─────────────────────────────────────────────────────────────

@teams_bp.route('/<team_id>/request-join', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def request_join(team_id):
    """
    Player requests to join a team.
    If the team is already in a tournament, check overlap first.
    """
    user = get_current_user()
    _, err = _ensure_player_profile(user)
    if err:
        return err

    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    if team.captain_user_id == user.id:
        return error_response("You're already the captain of this team", 400)

    existing_member = TeamMember.query.filter_by(
        team_id=team.id, user_id=user.id, status=TeamMember.STATUS_ACTIVE,
    ).first()
    if existing_member:
        return error_response("You're already on this team", 409)

    pending = PlayerJoinRequest.query.filter_by(
        team_id=team.id, user_id=user.id, status=PlayerJoinRequest.STATUS_PENDING,
    ).first()
    if pending:
        return error_response("You already have a pending request for this team", 409)

    # 🆕 If team is already in a tournament, check overlap before accepting request
    active_entries = TournamentTeam.query.filter(
        TournamentTeam.team_id == team.id,
        TournamentTeam.status.in_([
            TournamentTeam.STATUS_ACCEPTED,
            TournamentTeam.STATUS_REGISTERED,
        ]),
    ).all()

    for entry in active_entries:
        conflict = find_player_tournament_conflict(user.id, entry.tournament)
        if conflict:
            return error_response(
                f"You're already committed to another tournament that overlaps with "
                f"{entry.tournament.tournament_name} ({conflict.tournament_name}).",
                409,
                errors={
                    'code': 'TOURNAMENT_DATE_CONFLICT',
                    'conflict_tournament': conflict.tournament_name,
                    'target_tournament': entry.tournament.tournament_name,
                },
            )

    data = request.get_json() or {}
    message = (data.get('message') or '').strip() or None

    req = PlayerJoinRequest(
        team_id=team.id,
        user_id=user.id,
        message=message,
        status=PlayerJoinRequest.STATUS_PENDING,
    )
    db.session.add(req)
    db.session.commit()

    try:
        player_name = user.player_profile.full_name if user.player_profile else user.email
        NotificationService.notify_join_request_received(
            captain_user_id=team.captain_user_id,
            player_name=player_name,
            team_name=team.name,
            team_id=team.id,
        )
    except Exception:
        pass
    return success_response(data={'request': req.to_dict()}, status_code=201)


# ─────────────────────────────────────────────────────────────
#  Player search
# ─────────────────────────────────────────────────────────────

@teams_bp.route('/search-players', methods=['GET'])
@jwt_required()
def search_players():
    user = get_current_user()
    team_id = request.args.get('team_id')
    q = (request.args.get('q') or '').strip()

    query = Player.query.join(User, Player.user_id == User.id).filter(
        User.is_active == True,
        User.is_suspended == False,
        Player.user_id != user.id,
    )
    if q:
        query = query.filter(Player.full_name.ilike(f'%{q}%'))
    if team_id:
        team = db.session.get(Team, team_id)
        if team and team.captain_user_id == user.id:
            existing_ids = [m.user_id for m in team.active_members()]
            if existing_ids:
                query = query.filter(~Player.user_id.in_(existing_ids))
    query = query.order_by(Player.full_name.asc()).limit(20)
    players = query.all()
    return success_response(data={
        'players': [
            {
                'user_id': p.user_id,
                'full_name': p.full_name,
                'position': p.position,
                'nationality': p.nationality,
                'age': p.age,
                'profile_picture_url': p.profile_picture_url,
            }
            for p in players
        ]
    })


# ─────────────────────────────────────────────────────────────
#  Team requests to join a tournament — WITH overlap check
# ─────────────────────────────────────────────────────────────

@teams_bp.route('/<team_id>/request-tournament', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def request_tournament(team_id):
    """
    Captain requests to enter their team into a tournament.
    Checks:
      1. Registration is open
      2. Team not already in this tournament
      3. Team meets min players
      4. No squad member is in another overlapping tournament
      5. Tournament not full
    """
    from ....models import Tournament

    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err

    data = request.get_json() or {}
    tournament_id = data.get('tournament_id')
    if not tournament_id:
        return error_response("tournament_id is required", 400)

    tournament = db.session.get(Tournament, tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    if tournament.status not in [
        Tournament.ST_REGISTRATION_OPEN,
        Tournament.ST_FILLING_TEAMS,
    ]:
        return error_response(
            "Registration is not open for this tournament", 400,
            errors={'code': 'NOT_OPEN'},
        )

    existing = TournamentTeam.query.filter_by(
        tournament_id=tournament.id, team_id=team.id,
    ).first()
    if existing:
        return error_response(
            f"This team already has a status for this tournament: {existing.status}",
            409,
        )

    # Squad capacity
    member_count = team.active_members_count()
    if member_count < tournament.min_players_per_team:
        return error_response(
            f"Team has {member_count} player(s) but this tournament requires "
            f"at least {tournament.min_players_per_team}. Add more players first.",
            400,
            errors={
                'code': 'TEAM_UNDERSTAFFED',
                'current': member_count,
                'required': tournament.min_players_per_team,
                'missing': tournament.min_players_per_team - member_count,
            },
        )

    # 🆕 Tournament overlap check
    conflict = find_team_conflict(team, tournament)
    if conflict:
        player_id, conflicting_t = conflict
        player = db.session.get(User, player_id)
        player_name = (
            player.player_profile.full_name if player and player.player_profile
            else player.email if player else "A player"
        )
        return error_response(
            f"{player_name} is already committed to another overlapping tournament "
            f"({conflicting_t.tournament_name}). Remove them or choose a team without "
            f"conflicting tournaments.",
            409,
            errors={
                'code': 'TOURNAMENT_DATE_CONFLICT',
                'player_id': player_id,
                'player_name': player_name,
                'conflict_tournament': conflicting_t.tournament_name,
                'target_tournament': tournament.tournament_name,
            },
        )

    # Slot availability
    occupied = TournamentTeam.query.filter(
        TournamentTeam.tournament_id == tournament.id,
        TournamentTeam.status.in_([
            TournamentTeam.STATUS_ACCEPTED,
            TournamentTeam.STATUS_REGISTERED,
        ]),
    ).count()
    if occupied >= tournament.required_teams:
        return error_response(
            "Tournament is already full", 400,
            errors={'code': 'TOURNAMENT_FULL'},
        )

    entry = TournamentTeam(
        tournament_id=tournament.id,
        team_id=team.id,
        status=TournamentTeam.STATUS_JOIN_REQUESTED,
        invited_by_organizer=False,
    )
    db.session.add(entry)
    db.session.commit()

    try:
        NotificationService.create(
            user_id=tournament.organizer_user_id,
            title="New tournament join request",
            body=f"{team.name} has requested to join {tournament.tournament_name}.",
            notification_type="TOURNAMENT",
            related_id=tournament.id,
            related_type="Tournament",
        )
    except Exception:
        pass

    return success_response(
        data={'entry': entry.to_dict()},
        status_code=201,
        message="Join request sent to organizer.",
    )


# ─────────────────────────────────────────────────────────────
#  Captain accepts / declines tournament invite — WITH overlap check
# ─────────────────────────────────────────────────────────────

@teams_bp.route('/<team_id>/invitations/<entry_id>/accept', methods=['POST'])
@jwt_required()
def accept_tournament_invite(team_id, entry_id):
    """
    Captain accepts an INVITED tournament entry → ACCEPTED.
    Checks:
      1. Entry status is INVITED
      2. Squad meets min players
      3. No squad member is in another overlapping tournament
      4. Tournament not full
    """
    from ....models import Tournament

    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err

    entry = TournamentTeam.query.filter_by(
        id=entry_id, team_id=team.id,
    ).first()
    if not entry:
        return error_response("Invitation not found", 404)
    if entry.status != TournamentTeam.STATUS_INVITED:
        return error_response(
            f"Cannot accept invite in {entry.status} status", 400,
        )

    tournament = db.session.get(Tournament, entry.tournament_id)
    if not tournament:
        return error_response("Tournament not found", 404)

    # Squad capacity
    member_count = team.active_members_count()
    if member_count < tournament.min_players_per_team:
        return error_response(
            f"Your team has {member_count} player(s). You need at least "
            f"{tournament.min_players_per_team} to accept this invitation.",
            400,
            errors={
                'code': 'TEAM_UNDERSTAFFED',
                'current': member_count,
                'required': tournament.min_players_per_team,
                'missing': tournament.min_players_per_team - member_count,
            },
        )

    # 🆕 Tournament overlap check
    conflict = find_team_conflict(team, tournament)
    if conflict:
        player_id, conflicting_t = conflict
        player = db.session.get(User, player_id)
        player_name = (
            player.player_profile.full_name if player and player.player_profile
            else player.email if player else "A player"
        )
        return error_response(
            f"{player_name} is already committed to another overlapping tournament "
            f"({conflicting_t.tournament_name}). Your team cannot accept this invite "
            f"until that conflict is resolved.",
            409,
            errors={
                'code': 'TOURNAMENT_DATE_CONFLICT',
                'player_id': player_id,
                'player_name': player_name,
                'conflict_tournament': conflicting_t.tournament_name,
                'target_tournament': tournament.tournament_name,
            },
        )

    # Tournament capacity
    occupied = TournamentTeam.query.filter(
        TournamentTeam.tournament_id == tournament.id,
        TournamentTeam.status.in_([
            TournamentTeam.STATUS_ACCEPTED,
            TournamentTeam.STATUS_REGISTERED,
        ]),
    ).count()
    if occupied >= tournament.required_teams:
        entry.status = TournamentTeam.STATUS_REJECTED
        entry.responded_at = datetime.now(timezone.utc)
        db.session.commit()
        return error_response(
            "Tournament is already full — cannot accept", 400,
            errors={'code': 'TOURNAMENT_FULL'},
        )

    entry.status = TournamentTeam.STATUS_ACCEPTED
    entry.responded_at = datetime.now(timezone.utc)

    if tournament.status == Tournament.ST_REGISTRATION_OPEN:
        tournament.status = Tournament.ST_FILLING_TEAMS

    db.session.commit()

    try:
        NotificationService.create(
            user_id=tournament.organizer_user_id,
            title="Invitation accepted",
            body=f"{team.name} accepted your invitation to join {tournament.tournament_name}.",
            notification_type="TOURNAMENT",
            related_id=tournament.id,
            related_type="Tournament",
        )
    except Exception:
        pass
    return success_response(data={'entry': entry.to_dict()}, message="Invitation accepted")


@teams_bp.route('/<team_id>/invitations/<entry_id>/decline', methods=['POST'])
@jwt_required()
def decline_tournament_invite(team_id, entry_id):
    user = get_current_user()
    team = db.session.get(Team, team_id)
    if not team:
        return error_response("Team not found", 404)
    err = _captain_or_403(team, user)
    if err:
        return err
    entry = TournamentTeam.query.filter_by(
        id=entry_id, team_id=team.id,
    ).first()
    if not entry:
        return error_response("Invitation not found", 404)
    if entry.status != TournamentTeam.STATUS_INVITED:
        return error_response(
            f"Cannot decline invite in {entry.status} status", 400,
        )
    entry.status = TournamentTeam.STATUS_REJECTED
    entry.responded_at = datetime.now(timezone.utc)
    db.session.commit()
    return success_response(message="Invitation declined")