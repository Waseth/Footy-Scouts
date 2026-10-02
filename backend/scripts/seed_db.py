import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import Role, User, Subscription


def seed_roles(app):
    roles_data = [
        {'name': 'PLAYER',      'description': 'Football player'},
        {'name': 'SCOUT',       'description': 'Individual scout or scouting agency'},
        {'name': 'INSTITUTION', 'description': 'Football club, school, academy, or organization'},
        {'name': 'ADMIN',       'description': 'Platform administrator'},
    ]

    created = []
    for role_data in roles_data:
        existing = Role.query.filter_by(name=role_data['name']).first()
        if not existing:
            role = Role(**role_data)
            db.session.add(role)
            created.append(role_data['name'])

    db.session.commit()

    if created:
        print(f"  Roles created: {', '.join(created)}")
    else:
        print("   All roles already exist.")


def seed_admin(app):
    admin_email    = app.config.get('ADMIN_EMAIL')
    admin_password = app.config.get('ADMIN_PASSWORD')
    first_name     = app.config.get('ADMIN_FIRST_NAME', 'Super')
    last_name      = app.config.get('ADMIN_LAST_NAME', 'Admin')

    if not admin_email or not admin_password:
        print("   ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — skipping admin seed.")
        return

    existing = User.query.filter_by(email=admin_email).first()
    if existing:
        print(f"  Admin user '{admin_email}' already exists.")
        return

    admin_role = Role.query.filter_by(name='ADMIN').first()
    if not admin_role:
        print("  ADMIN role not found — run seed_roles first.")
        return

    admin = User(
        email=admin_email,
        role_id=admin_role.id,
        is_active=True,
        is_verified=True,
        is_approved=True,
    )
    admin.set_password(admin_password)
    db.session.add(admin)
    db.session.flush()

    sub = Subscription(user_id=admin.id, plan='FREE')
    db.session.add(sub)

    db.session.commit()
    print(f"  Admin user created: {admin_email}")


def seed_demo_data(app):
    """
    Insert demo players, scouts, and tournaments so the frontend has data.
    Safe to run multiple times — checks for existing rows by email/name.
    """
    from datetime import datetime, timezone, timedelta
    from app.models import Player, Scout, Tournament

    created = {"players": 0, "scouts": 0, "tournaments": 0}

    player_role      = Role.query.filter_by(name='PLAYER').first()
    scout_role       = Role.query.filter_by(name='SCOUT').first()
    institution_role = Role.query.filter_by(name='INSTITUTION').first()

    if not (player_role and scout_role and institution_role):
        print("  Roles missing — run seed_roles() first.")
        return

    demo_players = [
        {
            "email": "player1@example.com",
            "full_name": "Amani Otieno",
            "nationality": "Kenyan",
            "position": "Striker",
            "current_team": "Gor Mahia Youth",
            "gender": "Male",
            "biography": "Fast, two-footed forward with a knack for goals.",
        },
        {
            "email": "player2@example.com",
            "full_name": "Brian Kamau",
            "nationality": "Kenyan",
            "position": "Goalkeeper",
            "current_team": "Tusker FC Academy",
            "gender": "Male",
            "biography": "Commanding keeper, strong on crosses.",
        },
        {
            "email": "player3@example.com",
            "full_name": "Cynthia Wanjiru",
            "nationality": "Kenyan",
            "position": "Midfielder",
            "current_team": "Vihiga Queens",
            "gender": "Female",
            "biography": "Creative playmaker with excellent vision.",
        },
    ]

    for p in demo_players:
        existing = User.query.filter_by(email=p["email"]).first()
        if existing:
            continue
        u = User(
            email=p["email"],
            role_id=player_role.id,
            is_active=True,
            is_verified=True,
            is_approved=True,
        )
        u.set_password("Password123!")
        db.session.add(u)
        db.session.flush()

        db.session.add(Subscription(user_id=u.id, plan='FREE'))
        db.session.add(Player(
            user_id=u.id,
            full_name=p["full_name"],
            nationality=p["nationality"],
            position=p["position"],
            current_team=p["current_team"],
            gender=p["gender"],
            biography=p["biography"],
        ))
        created["players"] += 1

    # ── Demo scout (verified) ────────────────────────────────────
    scout_email = "scout1@example.com"
    if not User.query.filter_by(email=scout_email).first():
        u = User(
            email=scout_email,
            role_id=scout_role.id,
            is_active=True,
            is_verified=True,
            is_approved=True,
        )
        u.set_password("Password123!")
        db.session.add(u)
        db.session.flush()

        db.session.add(Subscription(user_id=u.id, plan='FREE'))
        db.session.add(Scout(
            user_id=u.id,
            scout_name="James Mwangi",
            scout_type="INDIVIDUAL",
            country="Kenya",
            city="Nairobi",
            contact_number="+254700000001",
            biography="10 years scouting talent across East Africa.",
            is_verified=True,
            verified_at=datetime.now(timezone.utc),
        ))
        created["scouts"] += 1

    # ── Demo institution (organizer for tournaments) ─────────────
    inst_email = "institution1@example.com"
    inst_user = User.query.filter_by(email=inst_email).first()
    if not inst_user:
        inst_user = User(
            email=inst_email,
            role_id=institution_role.id,
            is_active=True,
            is_verified=True,
            is_approved=True,
        )
        inst_user.set_password("Password123!")
        db.session.add(inst_user)
        db.session.flush()
        db.session.add(Subscription(user_id=inst_user.id, plan='FREE'))

    now = datetime.now(timezone.utc)
    demo_tournaments = [
        {
            "tournament_name": "Nairobi Youth Cup 2026",
            "tournament_type": "11-a-side",
            "location": "Nairobi, Kenya",
            "start_date": now + timedelta(days=30),
            "end_date":   now + timedelta(days=45),
            "registration_deadline": now + timedelta(days=20),
        },
        {
            "tournament_name": "Mombasa 5s Invitational",
            "tournament_type": "5-a-side",
            "location": "Mombasa, Kenya",
            "start_date": now + timedelta(days=15),
            "end_date":   now + timedelta(days=17),
            "registration_deadline": now + timedelta(days=10),
        },
        {
            "tournament_name": "Kisumu Schools Championship",
            "tournament_type": "9-a-side",
            "location": "Kisumu, Kenya",
            "start_date": now + timedelta(days=60),
            "end_date":   now + timedelta(days=65),
            "registration_deadline": now + timedelta(days=45),
        },
    ]

    for t in demo_tournaments:
        exists = Tournament.query.filter_by(tournament_name=t["tournament_name"]).first()
        if exists:
            continue
        db.session.add(Tournament(
            organizer_user_id=inst_user.id,
            organization_name="Footy Scouts Demo Org",
            representative_name="Demo Rep",
            organization_email="demo@footyscout.com",
            organization_phone="+254700000000",
            tournament_name=t["tournament_name"],
            tournament_type=t["tournament_type"],
            location=t["location"],
            registration_fee=1000,
            fee_currency="KES",
            description=f"Demo tournament: {t['tournament_name']}.",
            start_date=t["start_date"],
            end_date=t["end_date"],
            registration_deadline=t["registration_deadline"],
            status=Tournament.STATUS_UPCOMING,
            is_approved=True,
        ))
        created["tournaments"] += 1

    db.session.commit()
    print(
        f"  Demo data: +{created['players']} players, "
        f"+{created['scouts']} scouts, +{created['tournaments']} tournaments"
    )


def main():
    app = create_app()
    with app.app_context():
        print("\n  Seeding database …\n")
        seed_roles(app)
        seed_admin(app)
        seed_demo_data(app)
        print("\n  Seeding complete.\n")


if __name__ == '__main__':
    main()