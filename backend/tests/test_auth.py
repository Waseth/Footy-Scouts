"""tests/test_auth.py"""
import pytest


class TestRegister:
    def test_register_player_success(self, client):
        resp = client.post('/api/v1/auth/register', json={
            'email': 'newplayer@test.com',
            'password': 'StrongPass1!',
            'role': 'PLAYER',
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['success'] is True
        assert data['data']['user']['role'] == 'PLAYER'

    def test_register_duplicate_email(self, client, player_user):
        resp = client.post('/api/v1/auth/register', json={
            'email': 'player@test.com',
            'password': 'StrongPass1!',
            'role': 'PLAYER',
        })
        assert resp.status_code == 409

    def test_register_weak_password(self, client):
        resp = client.post('/api/v1/auth/register', json={
            'email': 'weak@test.com',
            'password': '1234',
            'role': 'PLAYER',
        })
        assert resp.status_code == 400

    def test_register_invalid_role(self, client):
        resp = client.post('/api/v1/auth/register', json={
            'email': 'bad@test.com',
            'password': 'StrongPass1!',
            'role': 'SUPERUSER',
        })
        assert resp.status_code == 400

    def test_register_invalid_email(self, client):
        resp = client.post('/api/v1/auth/register', json={
            'email': 'not-an-email',
            'password': 'StrongPass1!',
            'role': 'PLAYER',
        })
        assert resp.status_code == 400


class TestLogin:
    def test_login_success(self, client, player_user):
        resp = client.post('/api/v1/auth/login', json={
            'email': 'player@test.com',
            'password': 'PlayerPass1!',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'access_token' in data['data']
        assert 'refresh_token' in data['data']

    def test_login_wrong_password(self, client, player_user):
        resp = client.post('/api/v1/auth/login', json={
            'email': 'player@test.com',
            'password': 'WrongPassword1!',
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post('/api/v1/auth/login', json={
            'email': 'nobody@test.com',
            'password': 'AnyPass1!',
        })
        assert resp.status_code == 401

    def test_login_suspended_user(self, client, db, player_user):
        player_user.is_suspended = True
        db.session.commit()
        resp = client.post('/api/v1/auth/login', json={
            'email': 'player@test.com',
            'password': 'PlayerPass1!',
        })
        assert resp.status_code == 403


class TestLogout:
    def test_logout_success(self, client, player_token):
        resp = client.post(
            '/api/v1/auth/logout',
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 200

    def test_logout_requires_auth(self, client):
        resp = client.post('/api/v1/auth/logout')
        assert resp.status_code == 401


class TestPasswordReset:
    def test_forgot_password_always_200(self, client):
        """Should return 200 regardless of whether email exists."""
        resp = client.post('/api/v1/auth/forgot-password', json={'email': 'nobody@here.com'})
        assert resp.status_code == 200

    def test_reset_invalid_token(self, client):
        resp = client.post('/api/v1/auth/reset-password', json={
            'token': 'invalid-token-xyz',
            'new_password': 'NewStrongPass1!',
        })
        assert resp.status_code == 400


class TestMe:
    def test_get_current_user(self, client, player_token):
        resp = client.get(
            '/api/v1/auth/me',
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['data']['user']['email'] == 'player@test.com'

    def test_get_current_user_no_token(self, client):
        resp = client.get('/api/v1/auth/me')
        assert resp.status_code == 401