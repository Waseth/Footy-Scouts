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

        for table in reversed(_db.metadata.sorted_tables):
            if table.name == 'roles':
                continue
            try:
                _db.session.execute(table.delete())
            except Exception:
                _db.session.rollback()
        _db.session.commit()

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
#  Team + tournament fixtures
# ─────────────────────────────────────────────────────────────────

@pytest.fixture()
def captain_user(app):
    """A player user who will captain a team."""
    return _make_user('captain@test.com', 'CaptainPass1!', 'PLAYER')


@pytest.fixture()
def captain_token(client, captain_user):
    return _login_token(client, 'captain@test.com', 'CaptainPass1!')


@pytest.fixture()
def team(app, captain_user):
    """A team with 1 active member (captain)."""
    from app.models import Team, TeamMember
    with app.app_context():
        t = Team(captain_user_id=captain_user.id, name="Test Lions")
        _db.session.add(t)
        _db.session.flush()
        _db.session.add(TeamMember(team_id=t.id, user_id=captain_user.id,
                                    status=TeamMember.STATUS_ACTIVE))
        _db.session.commit()
        return t


@pytest.fixture()
def tournament_open(app, admin_user):
    """A published tournament with a fee, empty slots, registration open."""
    from app.models import Tournament
    from datetime import datetime, timezone, timedelta
    with app.app_context():
        t = Tournament(
            organizer_user_id=admin_user.id,
            organization_name="Test Org",
            representative_name="Rep",
            tournament_name="Test Cup",
            tournament_type="7-a-side",
            location="Nairobi",
            required_teams=4,
            min_players_per_team=5,
            max_players_per_team=8,
            team_entry_fee=2000,
            platform_fee_per_team=100,
            tournament_fee_total=8000,
            total_required_from_teams=8400,
            fee_currency='KES',
            start_date=datetime.now(timezone.utc) + timedelta(days=30),
            end_date=datetime.now(timezone.utc) + timedelta(days=31),
            status=Tournament.ST_FILLING_TEAMS,
            is_approved=True,
        )
        _db.session.add(t)
        _db.session.commit()
        return t


@pytest.fixture()
def accepted_entry(app, team, tournament_open):
    """
    A team ACCEPTED into the tournament, squad padded to exactly
    min_players_per_team (5). Team has 1 (captain) + 4 fillers = 5.
    """
    from app.models import TournamentTeam
    _make_squad(team.id, 4)
    with app.app_context():
        entry = TournamentTeam(
            tournament_id=tournament_open.id,
            team_id=team.id,
            status=TournamentTeam.STATUS_ACCEPTED,
        )
        _db.session.add(entry)
        _db.session.commit()
        return entry


@pytest.fixture()
def overstaffed_team(app, team):
    """Team with 1 (captain) + 8 fillers = 9 active members (over max=8)."""
    _make_squad(team.id, 8, prefix="over")
    return team


# ─────────────────────────────────────────────────────────────────
#  Helpers (also usable from tests: `from tests.conftest import _make_squad`)
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


def _make_squad(team_id, n_extra, prefix="p"):
    """Add n_extra filler players to a team. Returns the list of users."""
    from app.models import Role, User, TeamMember, Player, Subscription
    role = Role.query.filter_by(name='PLAYER').first()
    users = []
    for i in range(n_extra):
        email = f"{prefix}{i}@test.com"
        if User.query.filter_by(email=email).first():
            continue
        u = User(email=email, role_id=role.id, is_active=True,
                 is_verified=True, is_approved=True)
        u.set_password('Pass1234!')
        _db.session.add(u)
        _db.session.flush()
        _db.session.add(Subscription(user_id=u.id, plan='FREE'))
        _db.session.add(Player(user_id=u.id, full_name=f"{prefix.title()} {i}"))
        _db.session.add(TeamMember(team_id=team_id, user_id=u.id,
                                    status=TeamMember.STATUS_ACTIVE))
        users.append(u)
    _db.session.commit()
    return users