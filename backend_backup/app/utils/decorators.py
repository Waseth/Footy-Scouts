from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt, verify_jwt_in_request

from ..models import User, Role


def role_required(*roles):
    """Decorator to restrict access to specific roles."""
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
    """Decorator to restrict to admin only."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if not claims.get('is_admin'):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def premium_required(f):
    """Decorator to restrict to premium (paid subscription) users."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_premium():
            return jsonify({
                'error': 'Premium subscription required',
                'code': 'SUBSCRIPTION_REQUIRED',
            }), 403
        return f(*args, **kwargs)
    return decorated_function


def approved_account_required(f):
    """Decorator to ensure scout/institution accounts are admin-approved."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
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
    """Ensure user account is active and not suspended."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'Account inactive'}), 403
        if user.is_suspended:
            return jsonify({'error': 'Account suspended'}), 403
        return f(*args, **kwargs)
    return decorated_function


def get_current_user():
    """Helper to get the current authenticated user object."""
    user_id = get_jwt_identity()
    return User.query.get(user_id)