"""
API v1 package - registers all route blueprints.
"""
from flask import Blueprint


from .auth import auth_bp
from .players import players_bp
from .scouts import scouts_bp
from .institutions import institutions_bp
from .tournaments import tournaments_bp
from .messaging import messaging_bp
from .subscriptions import subscriptions_bp
from .payments import payments_bp
from .admin import admin_bp
from .search import search_bp


v1_bp = Blueprint('v1', __name__, url_prefix='/api/v1')



__all__ = [
    'auth_bp',
    'players_bp',
    'scouts_bp',
    'institutions_bp',
    'tournaments_bp',
    'messaging_bp',
    'subscriptions_bp',
    'payments_bp',
    'admin_bp',
    'search_bp',
    'v1_bp',
]