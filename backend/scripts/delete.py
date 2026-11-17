import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import Role, User, Subscription


def delete_row(app):
    email = "akanlejeremy@gmail.com"
    user = User.query.filter_by(email=email).first()
    if not user:
        print("  No user found with that email.")
        return

    sub = Subscription.query.filter_by(user_id=user.id).first()
    if sub:
        db.session.delete(sub)
        db.session.flush()
        db.session.expire(user)  # drop the stale user.subscription reference

    db.session.delete(user)
    db.session.commit()


def main():
    app = create_app()
    with app.app_context():
        print("\n  Deleting row …\n")
        delete_row(app)
        print("\n  Done.\n")



def main():
    app = create_app()
    with app.app_context():
        print("\n  Deleting row …\n")
        delete_row(app)
        print("\n  Seeding complete.\n")


if __name__ == '__main__':
    main()