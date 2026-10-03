"""
Paystack service — server-side integration.

Uses raw `requests` (no SDK dependency) so it's easy to mock in tests
and has zero version-coupling to a third-party wrapper.

Docs: https://paystack.com/docs/api/
"""
import hmac
import hashlib
from flask import current_app
import requests


class PaystackService:
    BASE_URL = "https://api.paystack.co"

    # ─────────────────────────────────────────────────────────
    #  Internal helpers
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def _secret_key() -> str:
        key = current_app.config.get("PAYSTACK_SECRET_KEY")
        if not key:
            raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
        return key

    @staticmethod
    def _headers() -> dict:
        return {
            "Authorization": f"Bearer {PaystackService._secret_key()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    @staticmethod
    def _currency() -> str:
        return current_app.config.get("PAYSTACK_CURRENCY", "KES")

    # ─────────────────────────────────────────────────────────
    #  Amount handling
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def to_subunit(amount: float) -> int:
        """
        Convert a major-unit amount (e.g. KSh 1000.00) to Paystack's
        smallest unit (e.g. 100000 for KES, 100000 for NGN).

        Paystack uses the smallest unit for ALL currencies (cents/kobo).
        """
        return int(round(float(amount) * 100))

    @staticmethod
    def from_subunit(subunit: int) -> float:
        return round(int(subunit) / 100.0, 2)

    # ─────────────────────────────────────────────────────────
    #  Transaction endpoints
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def initialize_transaction(
        email: str,
        amount: float,
        reference: str,
        callback_url: str = None,
        metadata: dict = None,
        channels: list = None,
    ) -> dict:
        """
        Initialize a Paystack transaction.

        amount: major units (KES). Will be converted to subunit.
        Returns: { success, authorization_url, access_code, reference, raw }
        """
        url = f"{PaystackService.BASE_URL}/transaction/initialize"
        payload = {
            "email": email,
            "amount": PaystackService.to_subunit(amount),
            "currency": PaystackService._currency(),
            "reference": reference,
            "metadata": metadata or {},
        }
        if callback_url:
            payload["callback_url"] = callback_url
        if channels:
            payload["channels"] = channels

        try:
            resp = requests.post(url, json=payload, headers=PaystackService._headers(), timeout=30)
        except requests.RequestException as e:
            return {"success": False, "error": f"Network error: {e}"}

        try:
            data = resp.json()
        except ValueError:
            return {"success": False, "error": f"Invalid JSON from Paystack ({resp.status_code})"}

        if not resp.ok or not data.get("status"):
            return {
                "success": False,
                "error": data.get("message", f"HTTP {resp.status_code}"),
                "raw": data,
            }

        d = data.get("data", {})
        return {
            "success": True,
            "authorization_url": d.get("authorization_url"),
            "access_code": d.get("access_code"),
            "reference": d.get("reference"),
            "raw": data,
        }

    @staticmethod
    def verify_transaction(reference: str) -> dict:
        """
        Verify a transaction by reference.
        Returns: { success, status, amount, currency, reference, channel, raw }
        status: 'success' | 'failed' | 'abandoned' | 'pending' | 'reversed'
        """
        url = f"{PaystackService.BASE_URL}/transaction/verify/{reference}"

        try:
            resp = requests.get(url, headers=PaystackService._headers(), timeout=30)
        except requests.RequestException as e:
            return {"success": False, "error": f"Network error: {e}"}

        try:
            data = resp.json()
        except ValueError:
            return {"success": False, "error": f"Invalid JSON from Paystack ({resp.status_code})"}

        if not resp.ok or not data.get("status"):
            return {
                "success": False,
                "error": data.get("message", f"HTTP {resp.status_code}"),
                "raw": data,
            }

        d = data.get("data", {})
        return {
            "success": True,
            "status": d.get("status"),                # 'success', 'failed', etc.
            "amount": PaystackService.from_subunit(d.get("amount", 0)),
            "currency": d.get("currency"),
            "reference": d.get("reference"),
            "channel": d.get("channel"),
            "gateway_response": d.get("gateway_response"),
            "paid_at": d.get("paid_at"),
            "raw": data,
        }

    # ─────────────────────────────────────────────────────────
    #  Webhook signature
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def verify_webhook_signature(payload_bytes: bytes, signature_header: str) -> bool:
        """
        Paystack signs webhook bodies with HMAC-SHA512 of the raw body,
        using your secret key as the HMAC key.
        Header: x-paystack-signature
        """
        if not signature_header:
            return False

        secret = PaystackService._secret_key().encode("utf-8")
        expected = hmac.new(secret, payload_bytes, hashlib.sha512).hexdigest()

        # Constant-time compare
        return hmac.compare_digest(expected, signature_header)