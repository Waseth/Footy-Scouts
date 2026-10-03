import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


def get_int_env(key, default):
    value = os.environ.get(key)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        print(f"WARNING: {key} has invalid value '{value}'. Using default {default}.")
        return default


def get_bool_env(key, default=False):
    v = os.environ.get(key)
    if v is None:
        return default
    return v.strip().lower() in ('1', 'true', 'yes', 'on')


def _engine_options(db_url: str) -> dict:
    """
    Return SQLAlchemy engine options appropriate for the given DB URL.
    SQLite (esp. :memory:) doesn't support pool_size/max_overflow.
    """
    if not db_url or db_url.startswith('sqlite'):
        # SQLite: StaticPool, no pool sizing
        return {
            'pool_pre_ping': True,
        }
    # Postgres / MySQL: full pool config
    return {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_size': 10,
        'max_overflow': 20,
    }


_DEFAULT_DB_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost/footy_scout_db')


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')
    DEBUG = False
    TESTING = False

    # Database
    SQLALCHEMY_DATABASE_URI = _DEFAULT_DB_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = _engine_options(_DEFAULT_DB_URL)

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-prod')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=get_int_env('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=get_int_env('JWT_REFRESH_TOKEN_EXPIRES', 2592000))
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

    # Paystack
    PAYSTACK_SECRET_KEY = os.environ.get('PAYSTACK_SECRET_KEY')
    PAYSTACK_PUBLIC_KEY = os.environ.get('PAYSTACK_PUBLIC_KEY')
    PAYSTACK_CURRENCY = os.environ.get('PAYSTACK_CURRENCY', 'KES')
    PAYSTACK_CALLBACK_URL = os.environ.get(
        'PAYSTACK_CALLBACK_URL',
        f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment/paystack/callback"
    )
    PAYSTACK_WEBHOOK_URL = os.environ.get('PAYSTACK_WEBHOOK_URL')
    PAYSTACK_SKIP_WEBHOOK_SIGNATURE = get_bool_env('PAYSTACK_SKIP_WEBHOOK_SIGNATURE', False)

    # Email
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@footyscout.com')

    # Redis
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

    # CORS
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

    # Admin
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@footyscout.com')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
    ADMIN_FIRST_NAME = os.environ.get('ADMIN_FIRST_NAME', 'Super')
    ADMIN_LAST_NAME = os.environ.get('ADMIN_LAST_NAME', 'Admin')

    # Pricing (KES)
    MONTHLY_PRICE_KES = float(os.environ.get('MONTHLY_PRICE_KES', 1000))
    ANNUAL_PRICE_KES = float(os.environ.get('ANNUAL_PRICE_KES', 10000))

    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'memory://')

    # Pagination
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

    # File Upload
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}
    ALLOWED_DOC_EXTENSIONS = {'pdf'}

    # Sentry
    SENTRY_DSN = os.environ.get('SENTRY_DSN')


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = True
    RATELIMIT_ENABLED = False
    RATELIMIT_DEFAULT = "200 per day;50 per hour"


class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = True
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "200 per day;50 per hour"


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    # IMPORTANT: SQLite :memory: doesn't accept pool_size/max_overflow
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': False}
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=5)
    RATELIMIT_ENABLED = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}