"""
Paystack integration tests.

Uses the shared fixtures from tests/conftest.py:
  - client          → Flask test client
  - player_user     → User with PLAYER role, FREE subscription
  - player_token    → JWT access token for player_user
  - db              → per-test transaction (rolled back)

Unit tests mock the Paystack API via requests.post/get.
The integration test (opt-in) hits the Paystack sandbox.
"""
import json
import hmac
import hashlib
import os
from unittest.mock import patch, MagicMock

import pytest


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


# ─────────────────────────────────────────────────────────────────
#  Initialize
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
            json={'plan': 'MONTHLY', 'amount': 1},  # malicious
            headers=_auth_headers(player_token),
        )
        assert rv.status_code == 200
        # Check Paystack was called with the server-side amount
        call_kwargs = mock_post.call_args
        payload = call_kwargs.kwargs.get('json') or call_kwargs[1].get('json')
        assert payload['amount'] == 100000  # 1000 KES in subunits


# ─────────────────────────────────────────────────────────────────
#  Verify
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
#  Webhook
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
        # Early-return: no call to Paystack verify
        assert mock_get.call_count == 0


# ─────────────────────────────────────────────────────────────────
#  Tournament payment stubs (Option 3)
# ─────────────────────────────────────────────────────────────────

def test_team_entry_stub(client, player_token):
    rv = client.post(
        '/api/v1/payments/paystack/initialize/team-entry',
        headers=_auth_headers(player_token),
    )
    assert rv.status_code == 501


def test_tournament_final_stub(client, player_token):
    rv = client.post(
        '/api/v1/payments/paystack/initialize/tournament-final',
        headers=_auth_headers(player_token),
    )
    assert rv.status_code == 501


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