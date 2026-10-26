"""
Paystack integration tests.

Uses the shared fixtures from tests/conftest.py:
  - client          → Flask test client
  - player_user     → User with PLAYER role, FREE subscription
  - player_token    → JWT access token for player_user
  - captain_user    → User with PLAYER role who captains `team`
  - captain_token   → JWT access token for captain_user
  - team            → A team with 1 active member (captain)
  - tournament_open → Tournament with KES 2000 entry + 100 platform fee
  - accepted_entry  → TournamentTeam ACCEPTED with exactly 5 players
  - overstaffed_team→ Team with 9 active members (> max=8)
  - db              → per-test transaction (rolled back)
  - app             → Flask app

Unit tests mock the Paystack API via requests.post/get.
The integration test (opt-in) hits the Paystack sandbox.
"""
import json
import hmac
import hashlib
import os
from unittest.mock import patch, MagicMock

import pytest

from app.models import Tournament


# ─────────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────────

def _auth_headers(token):
    return {'Authorization': f'Bearer {token}'}


def _fake_paystack_initialize():
    return {
        "status": True,
        "message": "Authorization URL created",
        "data": {
            "authorization_url": "https://checkout.paystack.com/abc123",
            "access_code": "abc123",
            "reference": "FS-SUB-TEST00001",
        },
    }


def _fake_paystack_verify(status="success", amount=100000, ref="FS-SUB-TESTVERIFY"):
    return {
        "status": True,
        "data": {
            "status": status,
            "amount": amount,
            "currency": "KES",
            "reference": ref,
            "channel": "card",
            "gateway_response": "Successful" if status == "success" else "Failed",
            "id": 12345,
        },
    }


def _fake_paystack_init_team_entry():
    return {
        "status": True,
        "message": "Authorization URL created",
        "data": {
            "authorization_url": "https://checkout.paystack.com/tent01",
            "access_code": "tent01",
            "reference": "FS-TENT-TEST01",
        },
    }


def _fake_paystack_verify_team_entry(status="success", amount=210000, ref="FS-TENT-VERIFY"):
    return {
        "status": True,
        "data": {
            "status": status, "amount": amount, "currency": "KES",
            "reference": ref, "channel": "mobile_money",
            "gateway_response": "Successful",
            "id": 77777,
        },
    }


# ─────────────────────────────────────────────────────────────────
#  Subscription initialize
# ─────────────────────────────────────────────────────────────────

def test_initialize_subscription_success(client, player_token):
    """POST /payments/paystack/initialize creates Payment + returns authorization_url."""
    with patch('app.services.paystack_service.requests.post') as mock_post:
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = _fake_paystack_initialize()
        mock_post.return_value = mock_resp

        rv = client.post(
            '/api/v1/payments/paystack/initialize',
            json={'plan': 'MONTHLY'},
            headers=_auth_headers(player_token),
        )
        assert rv.status_code == 200
        body = rv.get_json()
        assert body['success'] is True
        assert body['data']['authorization_url'] == "https://checkout.paystack.com/abc123"
        assert body['data']['amount'] == 1000.0
        assert body['data']['currency'] == 'KES'
        assert body['data']['purpose'] == 'SUBSCRIPTION'


def test_initialize_rejects_unknown_plan(client, player_token):
    rv = client.post(
        '/api/v1/payments/paystack/initialize',
        json={'plan': 'YEARLY_HALF'},
        headers=_auth_headers(player_token),
    )
    assert rv.status_code == 400


def test_initialize_ignores_client_amount(client, player_token):
    """Client-provided amount must be ignored — server uses config."""
    with patch('app.services.paystack_service.requests.post') as mock_post:
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = _fake_paystack_initialize()
        mock_post.return_value = mock_resp

        rv = client.post(
            '/api/v1/payments/paystack/initialize',
            json={'plan': 'MONTHLY', 'amount': 1},
            headers=_auth_headers(player_token),
        )
        assert rv.status_code == 200
        payload = mock_post.call_args.kwargs.get('json')
        assert payload['amount'] == 100000


# ─────────────────────────────────────────────────────────────────
#  Subscription verify
# ─────────────────────────────────────────────────────────────────

def test_verify_success_activates_subscription(client, player_user, player_token, app):
    """Verify with status=success activates subscription."""
    from app.extensions import db
    from app.models import Payment

    with app.app_context():
        p = Payment(
            user_id=player_user.id, amount=1000, currency='KES',
            method=Payment.METHOD_PAYSTACK, status=Payment.STATUS_PENDING,
            purpose=Payment.PURPOSE_SUBSCRIPTION, plan='MONTHLY',
            paystack_reference='FS-SUB-TESTVERIFY',
        )
        db.session.add(p)
        db.session.commit()

    with patch('app.services.paystack_service.requests.get') as mock_get:
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = _fake_paystack_verify()
        mock_get.return_value = mock_resp

        rv = client.get(
            '/api/v1/payments/paystack/verify/FS-SUB-TESTVERIFY',
            headers=_auth_headers(player_token),
        )
        assert rv.status_code == 200
        body = rv.get_json()
        assert body['data']['payment']['status'] == 'COMPLETED'
        assert body['data']['subscription']['plan'] == 'MONTHLY'


def test_verify_amount_mismatch_fails(client, player_user, player_token, app):
    """If Paystack says paid a different amount → fail, do not activate."""
    from app.extensions import db
    from app.models import Payment

    with app.app_context():
        p = Payment(
            user_id=player_user.id, amount=1000, currency='KES',
            method=Payment.METHOD_PAYSTACK, status=Payment.STATUS_PENDING,
            purpose=Payment.PURPOSE_SUBSCRIPTION, plan='MONTHLY',
            paystack_reference='FS-SUB-MISMATCH',
        )
        db.session.add(p)
        db.session.commit()

    fake = _fake_paystack_verify(amount=1, ref='FS-SUB-MISMATCH')
    with patch('app.services.paystack_service.requests.get') as mock_get:
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = fake
        mock_get.return_value = mock_resp

        rv = client.get(
            '/api/v1/payments/paystack/verify/FS-SUB-MISMATCH',
            headers=_auth_headers(player_token),
        )
        assert rv.status_code == 400


# ─────────────────────────────────────────────────────────────────
#  Subscription webhook
# ─────────────────────────────────────────────────────────────────

def test_webhook_invalid_signature_rejected(client, app):
    with app.app_context():
        app.config['PAYSTACK_SKIP_WEBHOOK_SIGNATURE'] = False
        app.config['PAYSTACK_SECRET_KEY'] = 'sk_test_dummy'

    rv = client.post(
        '/api/v1/payments/paystack/webhook',
        data=json.dumps({"event": "charge.success", "data": {}}),
        headers={'x-paystack-signature': 'bogus'},
        content_type='application/json',
    )
    assert rv.status_code == 401


def test_webhook_valid_signature_activates(client, player_user, app):
    from app.extensions import db
    from app.models import Payment

    secret = 'sk_test_dummy'
    with app.app_context():
        app.config['PAYSTACK_SECRET_KEY'] = secret
        app.config['PAYSTACK_SKIP_WEBHOOK_SIGNATURE'] = False

        p = Payment(
            user_id=player_user.id, amount=1000, currency='KES',
            method=Payment.METHOD_PAYSTACK, status=Payment.STATUS_PENDING,
            purpose=Payment.PURPOSE_SUBSCRIPTION, plan='MONTHLY',
            paystack_reference='FS-SUB-WEBHOOK',
        )
        db.session.add(p)
        db.session.commit()

    payload = {"event": "charge.success", "data": {"reference": "FS-SUB-WEBHOOK", "id": 99999}}
    body = json.dumps(payload).encode()
    sig = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()

    fake = _fake_paystack_verify(ref='FS-SUB-WEBHOOK')
    with patch('app.services.paystack_service.requests.get') as mock_get:
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = fake
        mock_get.return_value = mock_resp

        rv = client.post(
            '/api/v1/payments/paystack/webhook',
            data=body,
            headers={'x-paystack-signature': sig},
            content_type='application/json',
        )
        assert rv.status_code == 200

    with app.app_context():
        p = Payment.query.filter_by(paystack_reference='FS-SUB-WEBHOOK').first()
        assert p.status == 'COMPLETED'


def test_webhook_duplicate_is_idempotent(client, player_user, app):
    """Second webhook for a completed payment is a no-op."""
    from app.extensions import db
    from app.models import Payment

    secret = 'sk_test_dummy'
    with app.app_context():
        app.config['PAYSTACK_SECRET_KEY'] = secret
        app.config['PAYSTACK_SKIP_WEBHOOK_SIGNATURE'] = False

        p = Payment(
            user_id=player_user.id, amount=1000, currency='KES',
            method=Payment.METHOD_PAYSTACK, status=Payment.STATUS_COMPLETED,
            purpose=Payment.PURPOSE_SUBSCRIPTION, plan='MONTHLY',
            paystack_reference='FS-SUB-DUP',
        )
        db.session.add(p)
        db.session.commit()

    payload = {"event": "charge.success", "data": {"reference": "FS-SUB-DUP", "id": 88888}}
    body = json.dumps(payload).encode()
    sig = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()

    with patch('app.services.paystack_service.requests.get') as mock_get:
        rv = client.post(
            '/api/v1/payments/paystack/webhook',
            data=body,
            headers={'x-paystack-signature': sig},
            content_type='application/json',
        )
        assert rv.status_code == 200
        assert mock_get.call_count == 0


# ─────────────────────────────────────────────────────────────────
#  Tournament team entry — initialize
# ─────────────────────────────────────────────────────────────────

def test_team_entry_initialize_success(client, captain_token, team, tournament_open,
                                        accepted_entry, app):
    with app.app_context():
        tournament_id = tournament_open.id
        team_id = team.id

    with patch('app.services.paystack_service.requests.post') as mock_post:
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = _fake_paystack_init_team_entry()
        mock_post.return_value = mock_resp

        rv = client.post(
            '/api/v1/payments/paystack/initialize/team-entry',
            json={'team_id': team_id, 'tournament_id': tournament_id},
            headers=_auth_headers(captain_token),
        )
        assert rv.status_code == 200, rv.get_json()
        body = rv.get_json()
        assert body['data']['purpose'] == 'TEAM_TOURNAMENT_ENTRY'
        assert body['data']['amount'] == 2100.0
        assert body['data']['fee_breakdown'] == {
            'team_entry_fee': 2000.0,
            'platform_fee': 100.0,
            'total': 2100.0,
        }
        payload = mock_post.call_args.kwargs.get('json')
        assert payload['amount'] == 210000


def test_team_entry_initialize_not_captain(client, player_token, team, tournament_open,
                                           accepted_entry, app):
    with app.app_context():
        tournament_id = tournament_open.id
        team_id = team.id
    rv = client.post(
        '/api/v1/payments/paystack/initialize/team-entry',
        json={'team_id': team_id, 'tournament_id': tournament_id},
        headers=_auth_headers(player_token),
    )
    assert rv.status_code == 403


def test_team_entry_initialize_squad_too_small(client, captain_token, team,
                                                tournament_open, app):
    """Entry is ACCEPTED, but squad = 1 < min(5)."""
    from app.models import TournamentTeam
    from app.extensions import db as _db
    with app.app_context():
        entry = TournamentTeam(
            tournament_id=tournament_open.id,
            team_id=team.id,
            status=TournamentTeam.STATUS_ACCEPTED,
        )
        _db.session.add(entry)
        _db.session.commit()
        tournament_id, team_id = tournament_open.id, team.id

    rv = client.post(
        '/api/v1/payments/paystack/initialize/team-entry',
        json={'team_id': team_id, 'tournament_id': tournament_id},
        headers=_auth_headers(captain_token),
    )
    assert rv.status_code == 400
    assert rv.get_json()['errors']['code'] == 'TEAM_UNDERSTAFFED'


def test_team_entry_initialize_squad_too_large(client, captain_token, overstaffed_team,
                                                tournament_open, app):
    """Squad = 9 > max(8)."""
    from app.models import TournamentTeam
    from app.extensions import db as _db
    with app.app_context():
        entry = TournamentTeam(
            tournament_id=tournament_open.id,
            team_id=overstaffed_team.id,
            status=TournamentTeam.STATUS_ACCEPTED,
        )
        _db.session.add(entry)
        _db.session.commit()
        tournament_id, team_id = tournament_open.id, overstaffed_team.id

    rv = client.post(
        '/api/v1/payments/paystack/initialize/team-entry',
        json={'team_id': team_id, 'tournament_id': tournament_id},
        headers=_auth_headers(captain_token),
    )
    assert rv.status_code == 400
    assert rv.get_json()['errors']['code'] == 'TEAM_OVERSTAFFED'


def test_team_entry_initialize_wrong_status(client, captain_token, team, tournament_open, app):
    """Entry is JOIN_REQUESTED, not ACCEPTED."""
    from app.models import TournamentTeam
    from app.extensions import db as _db
    with app.app_context():
        entry = TournamentTeam(
            tournament_id=tournament_open.id, team_id=team.id,
            status=TournamentTeam.STATUS_JOIN_REQUESTED,
        )
        _db.session.add(entry)
        _db.session.commit()
        tournament_id, team_id = tournament_open.id, team.id

    rv = client.post(
        '/api/v1/payments/paystack/initialize/team-entry',
        json={'team_id': team_id, 'tournament_id': tournament_id},
        headers=_auth_headers(captain_token),
    )
    assert rv.status_code == 400
    assert rv.get_json()['errors']['code'] == 'NOT_ACCEPTED'


def test_team_entry_initialize_no_double_charge(client, captain_token, team,
                                                 tournament_open, accepted_entry, app):
    """A pending payment for the same (team, tournament) blocks re-init."""
    with app.app_context():
        payload = {'team_id': team.id, 'tournament_id': tournament_open.id}

    with patch('app.services.paystack_service.requests.post') as mock_post:
        mock_resp = MagicMock(); mock_resp.ok = True
        mock_resp.json.return_value = _fake_paystack_init_team_entry()
        mock_post.return_value = mock_resp

        rv1 = client.post(
            '/api/v1/payments/paystack/initialize/team-entry',
            json=payload, headers=_auth_headers(captain_token),
        )
        assert rv1.status_code == 200

        rv2 = client.post(
            '/api/v1/payments/paystack/initialize/team-entry',
            json=payload, headers=_auth_headers(captain_token),
        )
        assert rv2.status_code == 409
        assert rv2.get_json()['errors']['code'] in ('PAYMENT_IN_PROGRESS', 'ALREADY_PAID')


# ─────────────────────────────────────────────────────────────────
#  Tournament team entry — verify
# ─────────────────────────────────────────────────────────────────

def test_team_entry_verify_registers_team(client, captain_user, captain_token, team,
                                           tournament_open, accepted_entry, app):
    from app.models import Payment, TournamentTeam
    from app.extensions import db as _db

    with app.app_context():
        p = Payment(
            user_id=captain_user.id, amount=2100, currency='KES',
            method=Payment.METHOD_PAYSTACK, status=Payment.STATUS_PENDING,
            purpose=Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY,
            team_id=team.id, tournament_id=tournament_open.id,
            paystack_reference='FS-TENT-VERIFY',
        )
        _db.session.add(p); _db.session.commit()
        entry_id = accepted_entry.id

    with patch('app.services.paystack_service.requests.get') as mock_get:
        mock_resp = MagicMock(); mock_resp.ok = True
        mock_resp.json.return_value = _fake_paystack_verify_team_entry()
        mock_get.return_value = mock_resp

        rv = client.get(
            '/api/v1/payments/paystack/verify/FS-TENT-VERIFY',
            headers=_auth_headers(captain_token),
        )
        assert rv.status_code == 200, rv.get_json()

    with app.app_context():
        entry = _db.session.get(TournamentTeam, entry_id)
        assert entry.status == TournamentTeam.STATUS_REGISTERED
        assert entry.registered_at is not None
        assert entry.entry_payment_id is not None


def test_team_entry_verify_amount_mismatch(client, captain_user, captain_token, team,
                                            tournament_open, accepted_entry, app):
    from app.models import Payment, TournamentTeam
    from app.extensions import db as _db

    with app.app_context():
        p = Payment(
            user_id=captain_user.id, amount=2100, currency='KES',
            method=Payment.METHOD_PAYSTACK, status=Payment.STATUS_PENDING,
            purpose=Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY,
            team_id=team.id, tournament_id=tournament_open.id,
            paystack_reference='FS-TENT-MISMATCH',
        )
        _db.session.add(p); _db.session.commit()
        entry_id = accepted_entry.id

    with patch('app.services.paystack_service.requests.get') as mock_get:
        mock_resp = MagicMock(); mock_resp.ok = True
        mock_resp.json.return_value = _fake_paystack_verify_team_entry(
            amount=1, ref='FS-TENT-MISMATCH',
        )
        mock_get.return_value = mock_resp

        rv = client.get(
            '/api/v1/payments/paystack/verify/FS-TENT-MISMATCH',
            headers=_auth_headers(captain_token),
        )
        assert rv.status_code == 400

    with app.app_context():
        entry = _db.session.get(TournamentTeam, entry_id)
        assert entry.status == TournamentTeam.STATUS_ACCEPTED


def test_team_entry_webhook_is_idempotent(client, captain_user, team, tournament_open,
                                           accepted_entry, app):
    from app.models import Payment, TournamentTeam
    from app.extensions import db as _db

    secret = 'sk_test_dummy'
    with app.app_context():
        app.config['PAYSTACK_SECRET_KEY'] = secret
        app.config['PAYSTACK_SKIP_WEBHOOK_SIGNATURE'] = False

        p = Payment(
            user_id=captain_user.id, amount=2100, currency='KES',
            method=Payment.METHOD_PAYSTACK, status=Payment.STATUS_PENDING,
            purpose=Payment.PURPOSE_TEAM_TOURNAMENT_ENTRY,
            team_id=team.id, tournament_id=tournament_open.id,
            paystack_reference='FS-TENT-DUP',
        )
        _db.session.add(p); _db.session.commit()
        entry_id = accepted_entry.id

    payload = {"event": "charge.success", "data": {"reference": "FS-TENT-DUP", "id": 55555}}
    body = json.dumps(payload).encode()
    sig = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()

    fake = _fake_paystack_verify_team_entry(ref='FS-TENT-DUP')
    with patch('app.services.paystack_service.requests.get') as mock_get:
        mock_resp = MagicMock(); mock_resp.ok = True
        mock_resp.json.return_value = fake
        mock_get.return_value = mock_resp

        rv1 = client.post(
            '/api/v1/payments/paystack/webhook',
            data=body, headers={'x-paystack-signature': sig},
            content_type='application/json',
        )
        assert rv1.status_code == 200

        rv2 = client.post(
            '/api/v1/payments/paystack/webhook',
            data=body, headers={'x-paystack-signature': sig},
            content_type='application/json',
        )
        assert rv2.status_code == 200
        assert mock_get.call_count == 1

    with app.app_context():
        entry = _db.session.get(TournamentTeam, entry_id)
        assert entry.status == TournamentTeam.STATUS_REGISTERED


# ─────────────────────────────────────────────────────────────────
#  Integration test (opt-in)
# ─────────────────────────────────────────────────────────────────

@pytest.mark.skipif(
    not os.environ.get('PAYSTACK_INTEGRATION_TEST'),
    reason="Set PAYSTACK_INTEGRATION_TEST=1 with a real sk_test_ key to run",
)
def test_paystack_sandbox_initialize(client, player_token):
    """Hits real Paystack sandbox. Skipped unless env var is set."""
    rv = client.post(
        '/api/v1/payments/paystack/initialize',
        json={'plan': 'MONTHLY'},
        headers=_auth_headers(player_token),
    )
    assert rv.status_code == 200
    body = rv.get_json()
    assert body['data']['authorization_url'].startswith('https://checkout.paystack.com/')