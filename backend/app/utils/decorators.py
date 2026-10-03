from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt, verify_jwt_in_request

from ..models import User, Role
from ..extensions import db


# ─────────────────────────────────────────────────────────────
#  Capability-based decorators (PREFERRED for new code)
# ─────────────────────────────────────────────────────────────

_CAPABILITY_CHECKS = {
    'player':      lambda u: u.has_player_capability(),
    'scout':       lambda u: u.has_scout_capability(),
    'institution': lambda u: u.has_institution_capability(),
    'organizer':   lambda u: u.has_organizer_capability(),
    'admin':       lambda u: u.is_admin(),
}


def capability_required(*capabilities, mode='any'):
    """
    Require the current user to hold one (or all) capabilities.
    A capability = existence of the relevant profile row.

    Usage:
        @capability_required('player')
        @capability_required('organizer', 'admin', mode='any')
        @capability_required('player', 'scout', mode='all')
    """
    if mode not in ('any', 'all'):
        raise ValueError("mode must be 'any' or 'all'")

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = db.session.get(User, user_id)
            if not user or not user.is_active or user.is_suspended:
                return jsonify({'error': 'Account inactive or suspended'}), 403

            checks = [_CAPABILITY_CHECKS[c] for c in capabilities if c in _CAPABILITY_CHECKS]
            if not checks:
                return jsonify({'error': 'No valid capability specified'}), 500

            passed = [c(user) for c in checks]
            ok = all(passed) if mode == 'all' else any(passed)

            if not ok:
                return jsonify({
                    'error': 'You do not have permission to perform this action.',
                    'code': 'CAPABILITY_REQUIRED',
                    'required': list(capabilities),
                    'mode': mode,
                    'yours': user.capabilities(),
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ─────────────────────────────────────────────────────────────
#  Legacy role-based decorator (kept for back-compat)
# ─────────────────────────────────────────────────────────────

def role_required(*roles):
    """Restrict access to specific primary roles (legacy)."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role')
            if user_role not in roles:
                return jsonify({'error': 'Access denied. Insufficient permissions.'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if not claims.get('is_admin'):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def premium_required(f):
    """Restrict to premium (paid subscription) users."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if not user or not user.is_premium():
            return jsonify({
                'error': 'Premium subscription required',
                'code': 'SUBSCRIPTION_REQUIRED',
            }), 403
        return f(*args, **kwargs)
    return decorated_function


def approved_account_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        if not user.is_approved and not user.is_admin():
            return jsonify({
                'error': 'Account pending admin approval',
                'code': 'PENDING_APPROVAL',
            }), 403
        return f(*args, **kwargs)
    return decorated_function


def active_account_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'Account inactive'}), 403
        if user.is_suspended:
            return jsonify({'error': 'Account suspended'}), 403
        return f(*args, **kwargs)
    return decorated_function


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def get_current_user():
    """Return the current authenticated User, or None."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, user_id)


def get_optional_viewer():
    """
    Return (viewer, is_authenticated) for use in public routes that
    change behavior when a user is logged in.

    Does NOT raise if the request has no/invalid token.
    """
    from flask_jwt_extended.exceptions import JWTExtendedException
    from jwt.exceptions import PyJWTError
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if not user_id:
            return None, False
        user = db.session.get(User, user_id)
        if not user or not user.is_active or user.is_suspended:
            return None, False
        return user, True
    except (JWTExtendedException, PyJWTError):
        return None, False
    except Exception:
        return None, False