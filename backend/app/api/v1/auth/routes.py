from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from ....services.auth_service import AuthService
from ....services.email_service import EmailService
from ....utils.validators import validate_email, validate_password
from ....utils.helpers import success_response, error_response
from ....utils.decorators import get_current_user
from ....extensions import limiter
from ....models import Role

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per hour")
def register():
    """Register a new user. Role: PLAYER, SCOUT, or INSTITUTION."""
    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role_name = data.get('role', 'PLAYER').upper()

    # Validate
    if not email or not password:
        return error_response("Email and password are required", 400)

    if not validate_email(email):
        return error_response("Invalid email address", 400)

    valid_pw, pw_msg = validate_password(password)
    if not valid_pw:
        return error_response(pw_msg, 400)

    valid_roles = [Role.PLAYER, Role.SCOUT, Role.INSTITUTION]
    if role_name not in valid_roles:
        return error_response(f"Invalid role. Choose from: {', '.join(valid_roles)}", 400)

    result, status = AuthService.register_user(email, password, role_name)

    if 'error' in result:
        return error_response(result['error'], status)

    user = result['user']

    # Send verification email (async in production)
    if user.email_verification_token:
        EmailService.send_verification_email(user.email, user.email_verification_token)

    approval_msg = ""
    if role_name in [Role.SCOUT, Role.INSTITUTION]:
        approval_msg = " Your account is pending admin approval before your profile goes public."

    return success_response(
        data={
            'user': user.to_dict(),
            'message': f'Registration successful.{approval_msg} Please verify your email.',
        },
        status_code=201,
    )


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("20 per hour")
def login():
    """Login with email and password."""
    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return error_response("Email and password are required", 400)

    result, status = AuthService.login_user(email, password)

    if 'error' in result:
        return error_response(result['error'], status)

    return success_response(data=result, status_code=200)


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Revoke the current access token."""
    jti = get_jwt()['jti']
    result, status = AuthService.logout_user(jti)
    return success_response(message=result['message'], status_code=status)


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Get a new access token using a refresh token."""
    user_id = get_jwt_identity()
    result, status = AuthService.refresh_access_token(user_id)
    if 'error' in result:
        return error_response(result['error'], status)
    return success_response(data=result, status_code=status)


@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("5 per hour")
def forgot_password():
    """Request a password reset email."""
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    if not email or not validate_email(email):
        return error_response("Valid email required", 400)

    result, status = AuthService.request_password_reset(email)

    # Send email if user found (token in result for internal use)
    if 'token' in result and 'user' in result:
        EmailService.send_password_reset_email(result['user'].email, result['token'])

    # Always return generic message (don't reveal if email exists)
    return success_response(message=result['message'], status_code=200)


@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("5 per hour")
def reset_password():
    """Reset password using token from email."""
    data = request.get_json()
    token = data.get('token', '')
    new_password = data.get('new_password', '')

    if not token or not new_password:
        return error_response("Token and new password are required", 400)

    valid_pw, pw_msg = validate_password(new_password)
    if not valid_pw:
        return error_response(pw_msg, 400)

    result, status = AuthService.reset_password(token, new_password)
    if 'error' in result:
        return error_response(result['error'], status)

    return success_response(message=result['message'], status_code=200)


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email with token."""
    data = request.get_json()
    token = data.get('token', '')
    if not token:
        return error_response("Token required", 400)

    result, status = AuthService.verify_email(token)
    if 'error' in result:
        return error_response(result['error'], status)
    return success_response(message=result['message'])


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user_info():
    """Get current authenticated user's basic info."""
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)
    return success_response(data={'user': user.to_dict()})