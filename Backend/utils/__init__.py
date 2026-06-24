"""
Utility modules for the Footy Scout backend.
"""
from .decorators import (
    role_required,
    admin_required,
    premium_required,
    approved_account_required,
    active_account_required,
    get_current_user
)
from .helpers import (
    success_response,
    error_response,
    get_subscription_end_date,
    format_currency,
    normalize_phone
)
from .validators import (
    validate_email,
    validate_password,
    validate_phone,
    validate_date,
    sanitize_string,
    validate_required_fields,
    validate_file_extension,
    validate_file_size,
    ALLOWED_EXTENSIONS_IMAGE,
    ALLOWED_EXTENSIONS_VIDEO,
    ALLOWED_EXTENSIONS_PDF,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    MAX_PDF_SIZE
)
from .pagination import paginate_query

__all__ = [
    # Decorators
    'role_required',
    'admin_required',
    'premium_required',
    'approved_account_required',
    'active_account_required',
    'get_current_user',
    # Helpers
    'success_response',
    'error_response',
    'get_subscription_end_date',
    'format_currency',
    'normalize_phone',
    # Validators
    'validate_email',
    'validate_password',
    'validate_phone',
    'validate_date',
    'sanitize_string',
    'validate_required_fields',
    'validate_file_extension',
    'validate_file_size',
    'ALLOWED_EXTENSIONS_IMAGE',
    'ALLOWED_EXTENSIONS_VIDEO',
    'ALLOWED_EXTENSIONS_PDF',
    'MAX_IMAGE_SIZE',
    'MAX_VIDEO_SIZE',
    'MAX_PDF_SIZE',
    # Pagination
    'paginate_query',
]