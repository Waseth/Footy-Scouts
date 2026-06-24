"""tests/test_tournaments.py"""
import pytest


class TestTournamentCRUD:
    TOURNAMENT_PAYLOAD = {
        'organization_name': 'FC Nairobi',
        'representative_name': 'Peter Kamau',
        'tournament_name': 'Nairobi Cup 2025',
        'tournament_type': '11-a-side',
        'location': 'Kasarani Stadium, Nairobi',
        'registration_fee': 2000,
        'fee_currency': 'KES',
        'description': 'Annual youth football cup.',
    }

    def test_create_tournament_authenticated(self, client, player_token):
        resp = client.post(
            '/api/v1/tournaments',
            json=self.TOURNAMENT_PAYLOAD,
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['data']['tournament']['tournament_name'] == 'Nairobi Cup 2025'
        # Not public yet — pending approval
        assert data['data']['tournament']['is_approved'] is False

    def test_create_tournament_unauthenticated(self, client):
        resp = client.post('/api/v1/tournaments', json=self.TOURNAMENT_PAYLOAD)
        assert resp.status_code == 401

    def test_create_tournament_missing_required(self, client, player_token):
        resp = client.post(
            '/api/v1/tournaments',
            json={'organization_name': 'FC Test'},  # missing required fields
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 400

    def test_create_tournament_invalid_type(self, client, player_token):
        payload = {**self.TOURNAMENT_PAYLOAD, 'tournament_type': '4-a-side'}
        resp = client.post(
            '/api/v1/tournaments',
            json=payload,
            headers={'Authorization': f'Bearer {player_token}'},
        )
        assert resp.status_code == 400

    def test_unapproved_tournament_not_public(self, client, player_token):
        create_resp = client.post(
            '/api/v1/tournaments',
            json=self.TOURNAMENT_PAYLOAD,
            headers={'Authorization': f'Bearer {player_token}'},
        )
        tournament_id = create_resp.get_json()['data']['tournament']['id']

        resp = client.get(f'/api/v1/tournaments/{tournament_id}')
        assert resp.status_code == 404  # Not public until approved

    def test_list_tournaments_empty(self, client):
        resp = client.get('/api/v1/tournaments')
        assert resp.status_code == 200


class TestParticipantRegistration:
    def _create_and_approve_tournament(self, client, admin_token, player_token):
        """Helper: create tournament, approve it, return id."""
        create_resp = client.post(
            '/api/v1/tournaments',
            json={
                'organization_name': 'FC Test',
                'representative_name': 'Rep Name',
                'tournament_name': 'Test Cup',
                'tournament_type': '7-a-side',
                'location': 'Nairobi',
            },
            headers={'Authorization': f'Bearer {player_token}'},
        )
        tournament_id = create_resp.get_json()['data']['tournament']['id']

        client.post(
            f'/api/v1/admin/tournaments/{tournament_id}/approve',
            headers={'Authorization': f'Bearer {admin_token}'},
        )
        return tournament_id

    def test_individual_registration(self, client, player_token, admin_token):
        tid = self._create_and_approve_tournament(client, admin_token, player_token)
        resp = client.post(
            f'/api/v1/tournaments/{tid}/register',
            json={
                'participant_type': 'INDIVIDUAL',
                'name': 'Ali Hassan',
                'age': 22,
                'email': 'ali@test.com',
                'phone': '0712345678',
            },
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert 'registration_fee' in data['data']
        assert 'payment_note' in data['data']

    def test_team_registration(self, client, player_token, admin_token):
        tid = self._create_and_approve_tournament(client, admin_token, player_token)
        resp = client.post(
            f'/api/v1/tournaments/{tid}/register',
            json={
                'participant_type': 'TEAM',
                'team_name': 'Lions FC',
                'team_representative': 'Coach Brian',
                'email': 'lions@test.com',
                'phone': '0722334455',
            },
        )
        assert resp.status_code == 201

    def test_registration_missing_fields(self, client, player_token, admin_token):
        tid = self._create_and_approve_tournament(client, admin_token, player_token)
        resp = client.post(
            f'/api/v1/tournaments/{tid}/register',
            json={'participant_type': 'INDIVIDUAL', 'name': 'Ali'},  # missing email/phone
        )
        assert resp.status_code == 400