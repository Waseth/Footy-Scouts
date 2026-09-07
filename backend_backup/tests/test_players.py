"""tests/test_players.py"""
import pytest


class TestPlayerProfile:
    def test_create_profile(self, client, player_token):
        resp = client.post(
            '/api/v1/players/profile',
            json={
                'full_name': 'John Doe',
                'nationality': 'Kenyan',
                'gender': 'Male',
                'position': 'Midfielder',
                'biography': 'Passionate midfielder from Nairobi.',
            },
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['data']['player']['full_name'] == 'John Doe'

    def test_create_profile_no_name(self, client, player_token):
        resp = client.post(
            '/api/v1/players/profile',
            json={'nationality': 'Kenyan'},
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 400

    def test_cannot_create_profile_twice(self, client, player_token):
        client.post(
            '/api/v1/players/profile',
            json={'full_name': 'John Doe'},
            headers={'Authorization': f'Bearer {player_token}'},
        )
        resp = client.post(
            '/api/v1/players/profile',
            json={'full_name': 'John Doe'},
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 409

    def test_get_my_profile(self, client, player_token):
        client.post(
            '/api/v1/players/profile',
            json={'full_name': 'Jane Doe'},
            headers={'Authorization': f'Bearer {player_token}'},
        )
        resp = client.get(
            '/api/v1/players/profile',
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 200

    def test_update_profile(self, client, player_token):
        client.post(
            '/api/v1/players/profile',
            json={'full_name': 'Jane Doe'},
            headers={'Authorization': f'Bearer {player_token}'},
        )
        resp = client.put(
            '/api/v1/players/profile',
            json={'position': 'Forward', 'biography': 'Updated bio.'},
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 200
        assert resp.get_json()['data']['player']['position'] == 'Forward'

    def test_scout_cannot_create_player_profile(self, client, scout_token):
        resp = client.post(
            '/api/v1/players/profile',
            json={'full_name': 'Scout as Player'},
            headers={'Authorization': f'Bearer {scout_token}'},
        )
        assert resp.status_code == 403


class TestPlayerPublicView:
    def test_public_profile_no_contact_for_free_player(self, client, player_token, db):
        client.post(
            '/api/v1/players/profile',
            json={
                'full_name': 'Free Player',
                'contact_number': '0712345678',
                'show_contact': True,
            },
            headers={'Authorization': f'Bearer {player_token}'},
        )
        # Get the player ID
        profile_resp = client.get(
            '/api/v1/players/profile',
            headers={'Authorization': f'Bearer {player_token}'},
        )
        player_id = profile_resp.get_json()['data']['player']['id']

        # Public view should NOT include contact for free player
        resp = client.get(f'/api/v1/players/{player_id}')
        assert resp.status_code == 200
        data = resp.get_json()
        # contact_number is only shown if player is premium
        assert 'contact_number' not in data['data']['player']