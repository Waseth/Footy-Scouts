from flask import jsonify
from datetime import datetime, timezone, timedelta


def success_response(data=None, message=None, status_code=200):
    response = {'success': True}
    if message:
        response['message'] = message
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code


def error_response(message: str, status_code: int = 400, errors=None):
    response = {'success': False, 'error': message}
    if errors:
        response['errors'] = errors
    return jsonify(response), status_code


def get_subscription_end_date(plan: str) -> datetime:
    """Return end datetime for a given subscription plan."""
    now = datetime.now(timezone.utc)
    if plan == 'MONTHLY':
        return now + timedelta(days=30)
    elif plan == 'ANNUAL':
        return now + timedelta(days=365)
    return None


def format_currency(amount: float, currency: str = 'KES') -> str:
    return f"{currency} {amount:,.2f}"


def normalize_phone(phone: str) -> str:
    """Normalize phone to 254XXXXXXXXX format (Kenya)."""
    cleaned = phone.replace('+', '').replace(' ', '').replace('-', '')
    if cleaned.startswith('0') and len(cleaned) == 10:
        return '254' + cleaned[1:]
    return cleaned