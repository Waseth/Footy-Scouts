"""
tests/conftest.py
─────────────────
Shared pytest fixtures for the test suite.
"""
import pytest
from app import create_app
from app.extensions import db as _db
from app.models import Role, User, Subscription


@pytest.fixture(scope='session')
def app():
    """Create application with testing config."""
    application = create_app('testing')
    application.config.update({
        'TESTING': True,
        'WTF_CSRF_ENABLED': False,
    })
    return application


@pytest.fixture(scope='session')
def _database(app):
    """Create database tables once per session."""
    with app.app_context():
        _db.create_all()
        _seed_roles()
        yield _db
        _db.drop_all()


@pytest.fixture(scope='function')
def db(app, _database):
    """Wrap each test in a transaction that gets rolled back."""
    with app.app_context():
        connection = _database.engine.connect()
        transaction = connection.begin()

        # Override session to use this connection
        _database.session.bind = connection
        yield _database

        _database.session.remove()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope='function')
def client(app, db):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def player_user(db):
    return _make_user('player@test.com', 'PlayerPass1!', 'PLAYER')


@pytest.fixture
def scout_user(db):
    user = _make_user('scout@test.com', 'ScoutPass1!', 'SCOUT')
    user.is_approved = True
    db.session.commit()
    return user


@pytest.fixture
def institution_user(db):
    user = _make_user('inst@test.com', 'InstPass1!', 'INSTITUTION')
    user.is_approved = True
    db.session.commit()
    return user


@pytest.fixture
def admin_user(db):
    return _make_user('admin@test.com', 'AdminPass1!', 'ADMIN')


@pytest.fixture
def player_token(client, player_user):
    return _login_token(client, 'player@test.com', 'PlayerPass1!')


@pytest.fixture
def scout_token(client, scout_user):
    return _login_token(client, 'scout@test.com', 'ScoutPass1!')


@pytest.fixture
def admin_token(client, admin_user):
    return _login_token(client, 'admin@test.com', 'AdminPass1!')


# ── Helpers ──────────────────────────────────────────────────────────────────

def _seed_roles():
    roles = ['PLAYER', 'SCOUT', 'INSTITUTION', 'ADMIN']
    for name in roles:
        if not Role.query.filter_by(name=name).first():
            _db.session.add(Role(name=name, description=name.lower()))
    _db.session.commit()


def _make_user(email, password, role_name):
    role = Role.query.filter_by(name=role_name).first()
    user = User(email=email, role_id=role.id, is_active=True, is_verified=True, is_approved=True)
    user.set_password(password)
    _db.session.add(user)
    _db.session.flush()
    sub = Subscription(user_id=user.id, plan='FREE')
    _db.session.add(sub)
    _db.session.commit()
    return user


def _login_token(client, email, password):
    resp = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
    data = resp.get_json()
    return data['data']['access_token']