import base64
import json
import requests
from datetime import datetime
from flask import current_app


class MpesaService:

    SANDBOX_BASE_URL = 'https://sandbox.safaricom.co.ke'
    PRODUCTION_BASE_URL = 'https://api.safaricom.co.ke'

    @staticmethod
    def _get_base_url():
        env = current_app.config.get('MPESA_ENV', 'sandbox')
        return MpesaService.PRODUCTION_BASE_URL if env == 'production' else MpesaService.SANDBOX_BASE_URL

    @staticmethod
    def _get_access_token() -> str:
        """Get OAuth access token from Safaricom."""
        consumer_key = current_app.config['MPESA_CONSUMER_KEY']
        consumer_secret = current_app.config['MPESA_CONSUMER_SECRET']
        base_url = MpesaService._get_base_url()

        credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
        headers = {'Authorization': f'Basic {credentials}'}

        response = requests.get(
            f"{base_url}/oauth/v1/generate?grant_type=client_credentials",
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()['access_token']

    @staticmethod
    def _generate_password(shortcode: str, passkey: str, timestamp: str) -> str:
        raw = f"{shortcode}{passkey}{timestamp}"
        return base64.b64encode(raw.encode()).decode()

    @staticmethod
    def stk_push(phone_number: str, amount: float, account_ref: str, description: str) -> dict:
        """
        Initiate M-Pesa STK Push (Lipa na M-Pesa Online).
        phone_number: format 2547XXXXXXXX
        amount: amount in KES (integer)
        """
        try:
            token = MpesaService._get_access_token()
            shortcode = current_app.config['MPESA_SHORTCODE']
            passkey = current_app.config['MPESA_PASSKEY']
            callback_url = current_app.config['MPESA_CALLBACK_URL']
            base_url = MpesaService._get_base_url()

            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = MpesaService._generate_password(shortcode, passkey, timestamp)

            # Normalize phone number (remove +, spaces)
            phone = phone_number.replace('+', '').replace(' ', '')
            if phone.startswith('0'):
                phone = '254' + phone[1:]

            payload = {
                'BusinessShortCode': shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'PartyA': phone,
                'PartyB': shortcode,
                'PhoneNumber': phone,
                'CallBackURL': callback_url,
                'AccountReference': account_ref[:12],  # Max 12 chars
                'TransactionDesc': description[:13],   # Max 13 chars
            }

            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            }

            response = requests.post(
                f"{base_url}/mpesa/stkpush/v1/processrequest",
                json=payload,
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            return {
                'success': True,
                'checkout_request_id': data.get('CheckoutRequestID'),
                'merchant_request_id': data.get('MerchantRequestID'),
                'response_code': data.get('ResponseCode'),
                'response_description': data.get('ResponseDescription'),
                'customer_message': data.get('CustomerMessage'),
            }

        except requests.RequestException as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def process_callback(callback_data: dict) -> dict:
        """
        Process M-Pesa STK callback.
        Returns parsed transaction info.
        """
        try:
            body = callback_data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            result_code = stk_callback.get('ResultCode')
            checkout_request_id = stk_callback.get('CheckoutRequestID')

            if result_code != 0:
                return {
                    'success': False,
                    'checkout_request_id': checkout_request_id,
                    'result_code': result_code,
                    'result_desc': stk_callback.get('ResultDesc'),
                }

            # Parse callback metadata
            metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            meta = {item['Name']: item.get('Value') for item in metadata}

            return {
                'success': True,
                'checkout_request_id': checkout_request_id,
                'amount': meta.get('Amount'),
                'mpesa_receipt': meta.get('MpesaReceiptNumber'),
                'transaction_date': meta.get('TransactionDate'),
                'phone_number': str(meta.get('PhoneNumber', '')),
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def query_stk_status(checkout_request_id: str) -> dict:
        """Query the status of an STK push transaction."""
        try:
            token = MpesaService._get_access_token()
            shortcode = current_app.config['MPESA_SHORTCODE']
            passkey = current_app.config['MPESA_PASSKEY']
            base_url = MpesaService._get_base_url()

            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = MpesaService._generate_password(shortcode, passkey, timestamp)

            payload = {
                'BusinessShortCode': shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id,
            }

            headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            response = requests.post(
                f"{base_url}/mpesa/stkpushquery/v1/query",
                json=payload, headers=headers, timeout=30,
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            return {'error': str(e)}