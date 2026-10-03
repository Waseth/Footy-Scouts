"""
tests/conftest.py
─────────────────
Shared pytest fixtures for the test suite.
"""
import pytest
from app import create_app
from app.extensions import db as _db
from app.models import Role, User, Subscription


# ─────────────────────────────────────────────────────────────────
#  Session-scoped app + schema
# ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope='session')
def app():
    application = create_app('testing')
    application.config.update({
        'TESTING': True,
        'WTF_CSRF_ENABLED': False,
    })
    with application.app_context():
        _db.create_all()
    yield application
    with application.app_context():
        _db.drop_all()


# ─────────────────────────────────────────────────────────────────
#  Autouse cleanup — wipe everything EXCEPT roles, then re-seed
# ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _clean_db(app):
    """
    Runs before every test.
    Wipes all data tables, keeps roles, and re-ensures roles exist.
    """
    with app.app_context():
        _db.session.remove()

        # Wipe everything except 'roles'
        for table in reversed(_db.metadata.sorted_tables):
            if table.name == 'roles':
                continue
            try:
                _db.session.execute(table.delete())
            except Exception:
                _db.session.rollback()
        _db.session.commit()

        # Ensure roles exist
        _seed_roles()

    yield


# ─────────────────────────────────────────────────────────────────
#  Core fixtures
# ─────────────────────────────────────────────────────────────────

@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def db(app):
    """Compatibility shim for tests that want the SQLAlchemy object."""
    return _db


# ─────────────────────────────────────────────────────────────────
#  User fixtures
# ─────────────────────────────────────────────────────────────────

@pytest.fixture()
def player_user(app):
    return _make_user('player@test.com', 'PlayerPass1!', 'PLAYER')


@pytest.fixture()
def scout_user(app):
    user = _make_user('scout@test.com', 'ScoutPass1!', 'SCOUT')
    user.is_approved = True
    _db.session.commit()
    return user


@pytest.fixture()
def institution_user(app):
    user = _make_user('inst@test.com', 'InstPass1!', 'INSTITUTION')
    user.is_approved = True
    _db.session.commit()
    return user


@pytest.fixture()
def admin_user(app):
    return _make_user('admin@test.com', 'AdminPass1!', 'ADMIN')


# ─────────────────────────────────────────────────────────────────
#  Token fixtures
# ─────────────────────────────────────────────────────────────────

@pytest.fixture()
def player_token(client, player_user):
    return _login_token(client, 'player@test.com', 'PlayerPass1!')


@pytest.fixture()
def scout_token(client, scout_user):
    return _login_token(client, 'scout@test.com', 'ScoutPass1!')


@pytest.fixture()
def admin_token(client, admin_user):
    return _login_token(client, 'admin@test.com', 'AdminPass1!')


# ─────────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────────

def _seed_roles():
    for name in ['PLAYER', 'SCOUT', 'INSTITUTION', 'ADMIN']:
        if not Role.query.filter_by(name=name).first():
            _db.session.add(Role(name=name, description=name.lower()))
    _db.session.commit()


def _make_user(email, password, role_name):
    role = Role.query.filter_by(name=role_name).first()
    assert role is not None, f"Role {role_name} missing — did _seed_roles run?"
    user = User(
        email=email,
        role_id=role.id,
        is_active=True,
        is_verified=True,
        is_approved=True,
    )
    user.set_password(password)
    _db.session.add(user)
    _db.session.flush()
    _db.session.add(Subscription(user_id=user.id, plan='FREE'))
    _db.session.commit()
    return user


def _login_token(client, email, password):
    resp = client.post(
        '/api/v1/auth/login',
        json={'email': email, 'password': password},
    )
    data = resp.get_json()
    return data['data']['access_token']