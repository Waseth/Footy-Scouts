import requests
import base64
from flask import current_app


class PayPalService:

    SANDBOX_BASE = 'https://api-m.sandbox.paypal.com'
    LIVE_BASE = 'https://api-m.paypal.com'

    @staticmethod
    def _base_url():
        mode = current_app.config.get('PAYPAL_MODE', 'sandbox')
        return PayPalService.LIVE_BASE if mode == 'live' else PayPalService.SANDBOX_BASE

    @staticmethod
    def _get_access_token() -> str:
        client_id = current_app.config['PAYPAL_CLIENT_ID']
        client_secret = current_app.config['PAYPAL_CLIENT_SECRET']
        credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

        response = requests.post(
            f"{PayPalService._base_url()}/v1/oauth2/token",
            data={'grant_type': 'client_credentials'},
            headers={
                'Authorization': f'Basic {credentials}',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()['access_token']

    @staticmethod
    def create_order(amount_usd: float, description: str, return_url: str, cancel_url: str) -> dict:
        """Create a PayPal order."""
        try:
            token = PayPalService._get_access_token()
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            }
            payload = {
                'intent': 'CAPTURE',
                'purchase_units': [{
                    'amount': {
                        'currency_code': 'USD',
                        'value': f'{amount_usd:.2f}',
                    },
                    'description': description,
                }],
                'application_context': {
                    'return_url': return_url,
                    'cancel_url': cancel_url,
                    'user_action': 'PAY_NOW',
                },
            }

            response = requests.post(
                f"{PayPalService._base_url()}/v2/checkout/orders",
                json=payload,
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            approve_link = next(
                (link['href'] for link in data.get('links', []) if link['rel'] == 'approve'),
                None
            )

            return {
                'success': True,
                'order_id': data['id'],
                'status': data['status'],
                'approve_url': approve_link,
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def capture_order(order_id: str) -> dict:
        """Capture (complete) a PayPal order after user approval."""
        try:
            token = PayPalService._get_access_token()
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            }
            response = requests.post(
                f"{PayPalService._base_url()}/v2/checkout/orders/{order_id}/capture",
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            if data['status'] == 'COMPLETED':
                capture = data['purchase_units'][0]['payments']['captures'][0]
                return {
                    'success': True,
                    'status': data['status'],
                    'order_id': order_id,
                    'capture_id': capture['id'],
                    'amount': capture['amount']['value'],
                    'currency': capture['amount']['currency_code'],
                }
            return {'success': False, 'status': data['status']}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def get_order(order_id: str) -> dict:
        """Get order details."""
        try:
            token = PayPalService._get_access_token()
            response = requests.get(
                f"{PayPalService._base_url()}/v2/checkout/orders/{order_id}",
                headers={'Authorization': f'Bearer {token}'},
                timeout=30,
            )
            response.raise_for_status()
            return {'success': True, 'data': response.json()}
        except Exception as e:
            return {'success': False, 'error': str(e)}