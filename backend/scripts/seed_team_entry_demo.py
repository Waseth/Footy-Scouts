"""
Seed a demo state for testing team-entry payment:

  - captain@demo.test       (player, captains the team)
  - 4 filler players        (so the team has exactly 5 active members = min)
  - Demo Lions FC           (team, captain owns it)
  - Demo Cup 2026           (tournament, KES 2000 entry + 100 platform fee,
                             open registration, 4 teams required)
  - Accepted entry          (team ACCEPTED into tournament → pay button visible)

Run:
    cd backend
    source .venv/bin/activate
    python scripts/seed_team_entry_demo.py

Prints the IDs and login credentials at the end.
"""
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models import (
    User, Role, Player, Subscription, Team, TeamMember,
    Tournament, TournamentTeam,
)

CAPTAIN_EMAIL = "captain@demo.test"
CAPTAIN_PASSWORD = "DemoPass1!"


def _ensure_role(name):
    role = Role.query.filter_by(name=name).first()
    if not role:
        role = Role(name=name, description=name.lower())
        db.session.add(role)
        db.session.flush()
    return role


def _ensure_user(email, password, role_name):
    user = User.query.filter_by(email=email).first()
    if user:
        return user
    role = _ensure_role(role_name)
    user = User(email=email, role_id=role.id, is_active=True,
                is_verified=True, is_approved=True)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    db.session.add(Subscription(user_id=user.id, plan='FREE'))
    db.session.flush()
    return user


def _ensure_player(user, full_name, position="Midfielder"):
    p = Player.query.filter_by(user_id=user.id).first()
    if p:
        return p
    p = Player(user_id=user.id, full_name=full_name, position=position)
    db.session.add(p)
    db.session.flush()
    return p


def main():
    app = create_app('development')
    with app.app_context():

        # 1. Captain
        captain = _ensure_user(CAPTAIN_EMAIL, CAPTAIN_PASSWORD, 'PLAYER')
        _ensure_player(captain, "Demo Captain", "Forward")

        # 2. Team
        team = Team.query.filter_by(name="Demo Lions FC").first()
        if not team:
            team = Team(
                captain_user_id=captain.id,
                name="Demo Lions FC",
                description="Seeded for team-entry payment testing.",
            )
            db.session.add(team)
            db.session.flush()

        # 3. Captain is also a member
        existing = TeamMember.query.filter_by(
            team_id=team.id, user_id=captain.id
        ).first()
        if not existing:
            db.session.add(TeamMember(
                team_id=team.id, user_id=captain.id,
                status=TeamMember.STATUS_ACTIVE,
            ))

        # 4. Four filler players → total squad = 5 (min_players_per_team)
        for i in range(1, 5):
            email = f"player{i}@demo.test"
            u = _ensure_user(email, "DemoPass1!", 'PLAYER')
            _ensure_player(u, f"Demo Player {i}", "Defender")
            exists = TeamMember.query.filter_by(
                team_id=team.id, user_id=u.id
            ).first()
            if not exists:
                db.session.add(TeamMember(
                    team_id=team.id, user_id=u.id,
                    status=TeamMember.STATUS_ACTIVE,
                ))

        db.session.flush()

        # 5. Tournament
        tournament = Tournament.query.filter_by(
            tournament_name="Demo Cup 2026"
        ).first()
        if not tournament:
            tournament = Tournament(
                organizer_user_id=captain.id,   # captain is also organizer — fine for demo
                organization_name="Demo Org",
                representative_name="Demo Captain",
                tournament_name="Demo Cup 2026",
                tournament_type="7-a-side",
                location="Nairobi",
                description="Seeded tournament for team-entry payment testing.",
                required_teams=4,
                min_players_per_team=5,
                max_players_per_team=8,
                team_entry_fee=2000,
                platform_fee_per_team=100,
                tournament_fee_total=8000,
                total_required_from_teams=8400,
                fee_currency='KES',
                start_date=datetime.now(timezone.utc) + timedelta(days=30),
                end_date=datetime.now(timezone.utc) + timedelta(days=31),
                registration_deadline=datetime.now(timezone.utc) + timedelta(days=14),
                status=Tournament.ST_FILLING_TEAMS,
                is_approved=True,
                published_at=datetime.now(timezone.utc),
            )
            db.session.add(tournament)
            db.session.flush()
        else:
            # Reset to pay-able state on re-run
            tournament.status = Tournament.ST_FILLING_TEAMS
            tournament.is_approved = True
            tournament.payout_code = None
            tournament.payout_status = 'PENDING'
            tournament.paid_out_at = None

        # 6. Entry in ACCEPTED status (pay button becomes visible)
        entry = TournamentTeam.query.filter_by(
            tournament_id=tournament.id, team_id=team.id,
        ).first()
        if not entry:
            entry = TournamentTeam(
                tournament_id=tournament.id,
                team_id=team.id,
                status=TournamentTeam.STATUS_ACCEPTED,
            )
            db.session.add(entry)
        else:
            # Reset on re-run so you can re-test
            entry.status = TournamentTeam.STATUS_ACCEPTED
            entry.entry_payment_id = None
            entry.registered_at = None

        db.session.commit()

        # Print summary
        print()
        print("=" * 60)
        print("  TEAM-ENTRY DEMO SEEDED")
        print("=" * 60)
        print(f"Captain login:  {CAPTAIN_EMAIL}")
        print(f"Password:       {CAPTAIN_PASSWORD}")
        print()
        print(f"Team ID:        {team.id}")
        print(f"Team name:      {team.name}")
        print(f"Squad size:     {team.active_members_count()}")
        print()
        print(f"Tournament ID:  {tournament.id}")
        print(f"Name:           {tournament.tournament_name}")
        print(f"Entry fee:      KES {float(tournament.team_entry_fee):,.2f}")
        print(f"Platform fee:   KES {float(tournament.platform_fee_per_team):,.2f}")
        print(f"Total to pay:   KES {float(tournament.team_entry_fee) + float(tournament.platform_fee_per_team):,.2f}")
        print(f"Status:         {tournament.status}")
        print()
        print(f"Entry ID:       {entry.id}")
        print(f"Entry status:   {entry.status}  (ACCEPTED → pay button should appear)")
        print()
        print("Next steps:")
        print("  1. Log in to the frontend as captain@demo.test / DemoPass1!")
        print(f"  2. Open http://localhost:3000/teams/{team.id}/manage")
        print("  3. You should see 'Tournament registrations' → 'Pay KES 2,100'")
        print("=" * 60)


if __name__ == "__main__":
    main()