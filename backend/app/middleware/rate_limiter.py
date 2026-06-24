"""
Rate limiting configuration and custom key functions.
The core Limiter is initialized in extensions.py.
This module provides additional helpers and custom limiters.
"""
from flask import request, jsonify
from flask_jwt_extended import decode_token
from flask_limiter.util import get_remote_address


def get_user_or_ip():
    """
    Rate-limit key: use the JWT user ID when authenticated,
    otherwise fall back to IP address. This prevents a single
    user from bypassing limits by rotating IPs.
    """
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            decoded = decode_token(token)
            return f"user:{decoded.get('sub', get_remote_address())}"
        except Exception:
            pass
    return f"ip:{get_remote_address()}"


# Per-endpoint limit decorators for import in route files
# Usage: @auth_rate_limit  on top of endpoint
#
# These are applied directly with @limiter.limit() in each route
# to keep things explicit. The defaults below are suggested limits.

AUTH_LIMIT          = "10 per hour"       # login / register
RESET_LIMIT         = "5 per hour"        # password reset
UPLOAD_LIMIT        = "20 per hour"       # media uploads
PAYMENT_LIMIT       = "5 per minute"      # payment initiation
MESSAGE_LIMIT       = "60 per minute"     # messaging
SEARCH_LIMIT        = "120 per minute"    # search endpoints
GENERAL_LIMIT       = "200 per day;50 per hour"