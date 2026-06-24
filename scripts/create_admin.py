"""
scripts/create_admin.py
───────────────────────
Interactive CLI to create or reset an admin account.

Usage:
    python scripts/create_admin.py
    python scripts/create_admin.py --email admin@example.com --password SecurePass1!
"""
import sys
import os
import argparse
import getpass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import Role, User, Subscription
from app.utils.validators import validate_email, validate_password


def create_or_update_admin(email: str, password: str):
    app = create_app()
    with app.app_context():
        # Validate inputs
        if not validate_email(email):
            print(f"❌  Invalid email: {email}")
            sys.exit(1)

        valid, msg = validate_password(password)
        if not valid:
            print(f"❌  Weak password: {msg}")
            sys.exit(1)

        admin_role = Role.query.filter_by(name='ADMIN').first()
        if not admin_role:
            print("❌  ADMIN role not found. Run: python scripts/seed_db.py first.")
            sys.exit(1)

        existing = User.query.filter_by(email=email.lower()).first()
        if existing:
            # Update existing user to admin
            existing.role_id = admin_role.id
            existing.is_active = True
            existing.is_verified = True
            existing.is_approved = True
            existing.is_suspended = False
            existing.set_password(password)
            db.session.commit()
            print(f"✅  Existing user '{email}' promoted to ADMIN and password updated.")
        else:
            user = User(
                email=email.lower(),
                role_id=admin_role.id,
                is_active=True,
                is_verified=True,
                is_approved=True,
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()

            sub = Subscription(user_id=user.id, plan='FREE')
            db.session.add(sub)
            db.session.commit()
            print(f"✅  Admin account created: {email}")


def main():
    parser = argparse.ArgumentParser(description='Create or update an admin account')
    parser.add_argument('--email',    help='Admin email address')
    parser.add_argument('--password', help='Admin password (will prompt if omitted)')
    args = parser.parse_args()

    email = args.email or input("Admin email: ").strip()
    if not email:
        print("❌  Email is required.")
        sys.exit(1)

    if args.password:
        password = args.password
    else:
        password = getpass.getpass("Admin password: ")
        confirm  = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("❌  Passwords do not match.")
            sys.exit(1)

    create_or_update_admin(email, password)


if __name__ == '__main__':
    main()