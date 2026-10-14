from flask import Blueprint, request
from ....extensions import db, limiter
from ....models import WaitlistSignup
from ....utils.helpers import success_response, error_response
from ....utils.validators import validate_email

waitlist_bp = Blueprint('waitlist', __name__)


@waitlist_bp.route('/', methods=['POST'], strict_slashes=False)
@limiter.limit("10 per hour")
def join_waitlist():
    """
    Public endpoint — add an email to the waitlist.
    Idempotent: if email already exists, returns 200 with already_on_list: true.
    """
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    source = (data.get('source') or 'general').strip().lower()

    if not email or not validate_email(email):
        return error_response("A valid email is required", 400)

    existing = WaitlistSignup.query.filter_by(email=email).first()
    if existing:
        return success_response(
            data={
                'signup': existing.to_dict(),
                'already_on_list': True,
            },
            message="You're already on the list.",
        )

    signup = WaitlistSignup(email=email, source=source)
    db.session.add(signup)
    db.session.commit()

    return success_response(
        data={
            'signup': signup.to_dict(),
            'already_on_list': False,
        },
        message="You're on the list!",
        status_code=201,
    )