"""
Tournament conflict detection.

Rule: A player cannot be on two teams that are in tournaments
      with OVERLAPPING dates.

Two tournaments overlap if their [start_date, end_date] ranges intersect.

Tie-breaking when a tournament has no end_date:
  - If end_date is None, assume the tournament runs for 1 day
    (start_date only). This is a defensive choice — organizers should
    always set end_date.
"""

from datetime import timedelta, timezone


def _tournament_range(t):
    """
    Return (start, end) as timezone-aware datetimes.
    If end_date is None, treat as start_date + 1 day.
    """
    if not t.start_date:
        return None
    start = t.start_date
    end = t.end_date or (t.start_date + timedelta(days=1))
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    return (start, end)


def ranges_overlap(a, b):
    """True if two (start, end) tuples overlap (inclusive)."""
    if not a or not b:
        return False
    a_start, a_end = a
    b_start, b_end = b
    return not (a_end < b_start or b_end < a_start)


def find_player_tournament_conflict(player_user_id, target_tournament):
    """
    Return the conflicting tournament if the player is already on a team
    that's ACCEPTED or REGISTERED for another tournament whose dates
    overlap with `target_tournament`. Returns None if no conflict.
    """
    from ..models import TeamMember, Tournament, TournamentTeam

    target_range = _tournament_range(target_tournament)
    if not target_range:
        return None

    # Find all team memberships for this player
    memberships = TeamMember.query.filter_by(
        user_id=player_user_id,
        status=TeamMember.STATUS_ACTIVE,
    ).all()

    team_ids = [m.team_id for m in memberships]
    if not team_ids:
        return None

    # Find any tournament_team entries for those teams that are
    # ACCEPTED or REGISTERED, in tournaments other than target_tournament
    entries = TournamentTeam.query.filter(
        TournamentTeam.team_id.in_(team_ids),
        TournamentTeam.status.in_([
            TournamentTeam.STATUS_ACCEPTED,
            TournamentTeam.STATUS_REGISTERED,
        ]),
        TournamentTeam.tournament_id != target_tournament.id,
    ).all()

    for entry in entries:
        other = entry.tournament
        if not other:
            continue
        other_range = _tournament_range(other)
        if ranges_overlap(target_range, other_range):
            return other

    return None


def find_team_conflict(team, target_tournament):
    """
    Return (player_user_id, conflicting_tournament) if any player on the
    team is already in another tournament that overlaps with
    `target_tournament`. Returns None if no conflict.
    """
    for member in team.active_members():
        conflict = find_player_tournament_conflict(member.user_id, target_tournament)
        if conflict:
            return (member.user_id, conflict)
    return None