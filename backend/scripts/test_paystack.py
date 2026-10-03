"""
Manual end-to-end Paystack test script.

Usage:
    cd backend
    python scripts/test_paystack.py

Requires PAYSTACK_SECRET_KEY in .env to be a real sk_test_ key.
"""
import os
import sys
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.services.paystack_service import PaystackService


def main():
    app = create_app()
    with app.app_context():
        key = app.config.get('PAYSTACK_SECRET_KEY', '')
        if not key or not key.startswith('sk_'):
            print("❌ PAYSTACK_SECRET_KEY missing or invalid.")
            print("   Set a real test key from https://dashboard.paystack.com/#/settings/developers")
            return 1

        ref = f"FS-MANUAL-{uuid.uuid4().hex[:8].upper()}"
        print(f"\n→ Initializing transaction for KES 100 (ref={ref})")

        result = PaystackService.initialize_transaction(
            email='test@footyscout.com',
            amount=100,
            reference=ref,
            callback_url='http://localhost:3000/payment/paystack/callback',
        )

        if not result.get('success'):
            print(f"❌ Initialize failed: {result.get('error')}")
            return 2

        print(f"✅ Initialized")
        print(f"   authorization_url: {result['authorization_url']}")
        print(f"   reference: {result['reference']}")
        print(f"\n👉 Open the authorization_url in a browser, pay with a test card,")
        print(f"   then re-run this script to verify.")

        print(f"\n→ Verifying {ref}")
        verify = PaystackService.verify_transaction(ref)
        if verify.get('success'):
            print(f"✅ Verify result: status={verify['status']} amount={verify['amount']} {verify['currency']}")
        else:
            print(f"❌ Verify failed: {verify.get('error')}")

        return 0


if __name__ == '__main__':
    sys.exit(main())