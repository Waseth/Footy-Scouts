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


def main():
    app = create_app()
    with app.app_context():
        print("\n  Seeding database …\n")
        seed_roles(app)
        seed_admin(app)
        print("\n  Seeding complete.\n")


if __name__ == '__main__':
    main()