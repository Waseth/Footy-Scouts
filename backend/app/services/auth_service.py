import secrets
from datetime import datetime, timezone, timedelta
from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token

from ..extensions import db, token_blocklist
from ..models import User, Role, Subscription


class AuthService:

    @staticmethod
    def _build_tokens(user: User) -> dict:
        """Generate access + refresh tokens for a user."""
        additional_claims = {
            'role': user.role_name,
            'email': user.email,
            'is_admin': user.is_admin(),
        }
        access_token = create_access_token(
            identity=user.id, additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(identity=user.id)
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
        }

    @staticmethod
    def register_user(email: str, password: str, role_name: str) -> dict:
        """Register a new user, create default subscription, and return tokens."""
        # Check email uniqueness
        if User.query.filter_by(email=email.lower()).first():
            return {'error': 'Email already registered'}, 409

        # Get role
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            return {'error': f'Invalid role: {role_name}'}, 400

        # Create user
        user = User(email=email.lower(), role_id=role.id)
        user.set_password(password)

        # Players are auto-approved; scouts/institutions need admin approval
        if role_name == Role.PLAYER:
            user.is_approved = True

        db.session.add(user)
        db.session.flush()  # Get user.id

        # Create free subscription
        subscription = Subscription(user_id=user.id, plan=Subscription.PLAN_FREE)
        db.session.add(subscription)

        db.session.commit()

        # 🆕 Return tokens so the user is auto-logged-in
        tokens = AuthService._build_tokens(user)

        return {
            'user': user,
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
        }, 201

    @staticmethod
    def login_user(email: str, password: str) -> dict:
        """Authenticate user and return tokens."""
        user = User.query.filter_by(email=email.lower()).first()

        if not user or not user.check_password(password):
            return {'error': 'Invalid email or password'}, 401

        if user.is_suspended:
            return {'error': 'Account suspended. Contact support.'}, 403

        if not user.is_active:
            return {'error': 'Account is inactive'}, 403

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        # Generate tokens
        tokens = AuthService._build_tokens(user)

        return {
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
            'user': user.to_dict(),
            'is_admin': user.is_admin(),
        }, 200

    @staticmethod
    def logout_user(jti: str):
        """Revoke the JWT token."""
        token_blocklist.add(jti)
        return {'message': 'Logged out successfully'}, 200

    @staticmethod
    def refresh_access_token(user_id: str) -> dict:
        """Issue a new access token using a refresh token."""
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return {'error': 'User not found or inactive'}, 404

        additional_claims = {
            'role': user.role_name,
            'email': user.email,
            'is_admin': user.is_admin(),
        }
        access_token = create_access_token(
            identity=user.id, additional_claims=additional_claims
        )
        return {'access_token': access_token}, 200

    @staticmethod
    def request_password_reset(email: str) -> dict:
        """Generate and store a password reset token."""
        user = User.query.filter_by(email=email.lower()).first()
        if not user:
            return {'message': 'If that email is registered, a reset link was sent.'}, 200

        return {'message': 'If that email is registered, a reset link was sent.'}, 200

    @staticmethod
    def reset_password(token: str, new_password: str) -> dict:
        """Reset user password using a valid reset token."""
        user = User.query.filter_by(reset_token=token).first()

        if not user:
            return {'error': 'Invalid or expired token'}, 400

        if not user.reset_token_expires or datetime.now(timezone.utc) > user.reset_token_expires:
            return {'error': 'Reset token has expired'}, 400

        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()

        return {'message': 'Password reset successfully'}, 200