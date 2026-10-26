"""
seed_full_tournament.py
───────────────────────
Fills Test Cup 2026 with 4 PAID (REGISTERED) teams + 1 accepted-unpaid team,
so you can exercise the organizer "close registration → payout" flow end-to-end.

Each paid team has:
  - a captain user
  - a squad of 5 players
  - a Payment record (COMPLETED, purpose=TEAM_TOURNAMENT_ENTRY, KES 2,100)
  - a TournamentTeam entry in REGISTERED status
  - entry_payment_id pointing at the Payment

Idempotent — safe to re-run. Uses the existing Test Cup 2026 and organizer@test.com.

Run:
    cd backend && source .venv/bin/activate
    python scripts/seed_full_tournament.py
"""
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import (
    User, Role, Player, Subscription, Team, TeamMember,
    Tournament, TournamentTeam, Payment,
)


def _role(name):
    r = Role.query.filter_by(name=name).first()
    if not r:
        r = Role(name=name, description=name.lower())
        db.session.add(r); db.session.flush()
    return r


def _make_player(email, full_name, password="TestPass1!"):
    u = User.query.filter_by(email=email).first()
    if u:
        return u
    u = User(
        email=email, role_id=_role('PLAYER').id,
        is_active=True, is_verified=True, is_approved=True,
    )
    u.set_password(password)
    db.session.add(u); db.session.flush()
    db.session.add(Subscription(user_id=u.id, plan='FREE'))
    db.session.add(Player(user_id=u.id, full_name=full_name))
    db.session.flush()
    return u


def _ensure_team(captain, name, prefix):
    team = Team.query.filter_by(name=name).first()
    if team:
        return team
    team = Team(captain_user_id=captain.id, name=name,
                description=f"Seeded for payout testing ({prefix})")
    db.session.add(team); db.session.flush()

    # Captain is a member
    if not TeamMember.query.filter_by(team_id=team.id, user_id=captain.id).first():
        db.session.add(TeamMember(
            team_id=team.id, user_id=captain.id, status=TeamMember.STATUS_ACTIVE))

    # 4 filler players → squad = 5 (min_players_per_team)
    for i in range(1, 5):
        filler = _make_player(
            f"{prefix}p{i}@test.com",
            f"{prefix.title()} Player {i}",
        )
        if not TeamMember.query.filter_by(team_id=team.id, user_id=filler.id).first():
            db.session.add(TeamMember(
                team_id=team.id, user_id=filler.id,
                status=TeamMember.STATUS_ACTIVE))
    db.session.flush()
    return team


def _make_entry(tournament, team, status, payment=None):
    entry = TournamentTeam.query.filter_by(
        tournament_id=tournament.id, team_id=team.id
    ).first()
    if not entry:
        entry = TournamentTeam(
            tournament_id=tournament.id, team_id=team.id, status=status,
        )
        db.session.add(entry); db.session.flush()
    else:
        entry.status = status

    if payment:
        entry.entry_payment_id = payment.id
        entry.registered_at = payment.completed_at
    return entry


def _make_payment(tournament, team, captain, amount):
    # Idempotency: check for existing COMPLETED payment for this (team, tournament)
    existing = Payment.query.filter_by(
        purpose=Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY,
        team_id=team.id,
        tournament_id=tournament.id,
        status=Payment.STATUS_COMPLETED,
    ).first()
    if existing:
        return existing

    ref = f"FS-TENT-SEED-{uuid.uuid4().hex[:10].upper()}"
    now = datetime.now(timezone.utc)
    p = Payment(
        user_id=captain.id,
        amount=amount,
        currency=Payment.CURRENCY_KES,
        method=Payment.METHOD_PAYSTACK,
        status=Payment.STATUS_COMPLETED,
        purpose=Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY,
        plan=None,
        paystack_reference=ref,
        email=captain.email,
        team_id=team.id,
        tournament_id=tournament.id,
        paystack_channel='mobile_money',
        transaction_id=str(uuid.uuid4().int)[:10],
        completed_at=now,
    )
    db.session.add(p); db.session.flush()
    return p


def main():
    app = create_app('development')
    with app.app_context():

        # Find the tournament
        tournament = Tournament.query.filter_by(
            tournament_name="Test Cup 2026"
        ).first()
        if not tournament:
            print("❌ Test Cup 2026 not found. Run seed_team_entry_demo.py first.")
            return

        organizer = User.query.get(tournament.organizer_user_id)
        if not organizer:
            print("❌ Organizer user missing from DB.")
            return

        # Confirm the paid teams scenario: total required teams
        required = tournament.required_teams
        already_registered = tournament.registered_teams_count()
        needed = max(0, required - already_registered)

        print(f"Tournament: {tournament.tournament_name}")
        print(f"Required teams: {required}")
        print(f"Already registered: {already_registered}")
        print(f"Seeding {needed} paid team(s) + 1 accepted-unpaid team")
        print()

        # Fee math
        team_fee = float(tournament.team_entry_fee)
        platform_fee = float(tournament.platform_fee_per_team)
        total_per_team = team_fee + platform_fee

        # Create paid teams until we reach `required`
        paid_created = 0
        for i in range(1, needed + 1):
            captain = _make_player(
                f"paidcaptain{i}@test.com",
                f"Paid Captain {i}",
            )
            team = _ensure_team(captain, f"Seeded Paid Team {i}", f"paid{i}")
            payment = _make_payment(tournament, team, captain, total_per_team)
            _make_entry(tournament, team, TournamentTeam.STATUS_REGISTERED, payment)
            paid_created += 1
            print(f"  ✅ Seeded paid team: {team.name}  (payment {payment.paystack_reference})")

        # One accepted-but-unpaid team (so organizer sees the "accepted · unpaid" warning)
        unpaid_captain = _make_player("unpaidcaptain@test.com", "Unpaid Captain")
        unpaid_team = _ensure_team(unpaid_captain, "Seeded Unpaid Team", "unpaid")
        _make_entry(tournament, unpaid_team, TournamentTeam.STATUS_ACCEPTED)
        print(f"  ✅ Seeded accepted-unpaid team: {unpaid_team.name}")

        # Refresh tournament status if it's now full
        db.session.commit()
        db.session.refresh(tournament)
        if tournament.registered_teams_count() >= tournament.required_teams:
            tournament.status = Tournament.ST_ALL_TEAMS_REGISTERED
            db.session.commit()

        print()
        print("=" * 60)
        print("NEXT STEPS")
        print("=" * 60)
        print(f"1. Log in as {organizer.email}")
        print(f"2. Open http://localhost:3000/dashboard/organizer/{tournament.id}")
        print(f"3. You'll see {tournament.registered_teams_count()}/{required} teams registered")
        print(f"4. Click 'Close registration' → confirm")
        print(f"5. A payout code will be generated")
        print(f"6. Log out, log back in as the ADMIN account")
        print(f"7. Go to /admin/payouts → see the pending payout → mark it paid")
        print("=" * 60)


if __name__ == "__main__":
    main()