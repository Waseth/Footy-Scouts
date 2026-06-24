import os
import sentry_sdk
from flask import Flask, jsonify
from sentry_sdk.integrations.flask import FlaskIntegration

from .config import config
from .extensions import init_extensions


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Sentry error monitoring (production)
    if app.config.get('SENTRY_DSN'):
        sentry_sdk.init(
            dsn=app.config['SENTRY_DSN'],
            integrations=[FlaskIntegration()],
            traces_sample_rate=0.1,
        )

    # Initialize extensions
    init_extensions(app)

    # Register blueprints
    _register_blueprints(app)

    # Register error handlers
    _register_error_handlers(app)

    # Health check
    @app.route('/health')
    def health():
        return jsonify({"status": "healthy", "service": "Footy Scout API"}), 200

    return app


def _register_blueprints(app):
    from .api.v1.auth.routes import auth_bp
    from .api.v1.players.routes import players_bp
    from .api.v1.scouts.routes import scouts_bp
    from .api.v1.institutions.routes import institutions_bp
    from .api.v1.tournaments.routes import tournaments_bp
    from .api.v1.messaging.routes import messaging_bp
    from .api.v1.subscriptions.routes import subscriptions_bp
    from .api.v1.payments.routes import payments_bp
    from .api.v1.admin.routes import admin_bp
    from .api.v1.search.routes import search_bp

    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(players_bp, url_prefix='/api/v1/players')
    app.register_blueprint(scouts_bp, url_prefix='/api/v1/scouts')
    app.register_blueprint(institutions_bp, url_prefix='/api/v1/institutions')
    app.register_blueprint(tournaments_bp, url_prefix='/api/v1/tournaments')
    app.register_blueprint(messaging_bp, url_prefix='/api/v1/messages')
    app.register_blueprint(subscriptions_bp, url_prefix='/api/v1/subscriptions')
    app.register_blueprint(payments_bp, url_prefix='/api/v1/payments')
    app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')
    app.register_blueprint(search_bp, url_prefix='/api/v1/search')


def _register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "message": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden", "message": "You don't have permission to access this resource"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({"error": "Unprocessable entity", "message": str(e)}), 422

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Rate limit exceeded", "message": str(e.description)}), 429

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500