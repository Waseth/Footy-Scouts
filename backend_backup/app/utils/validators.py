import re
from datetime import datetime


def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str]:
    """
    Password requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    return True, ""


def validate_phone(phone: str) -> bool:
    """Basic phone validation — accepts international format."""
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    return cleaned.isdigit() and 7 <= len(cleaned) <= 15


def validate_date(date_str: str, fmt: str = '%Y-%m-%d') -> bool:
    try:
        datetime.strptime(date_str, fmt)
        return True
    except (ValueError, TypeError):
        return False


def sanitize_string(s: str, max_length: int = 255) -> str:
    """Remove leading/trailing whitespace and truncate."""
    if not s:
        return s
    return str(s).strip()[:max_length]


def validate_required_fields(data: dict, required: list) -> tuple[bool, list]:
    missing = [field for field in required if not data.get(field)]
    return len(missing) == 0, missing


ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
ALLOWED_VIDEO_TYPES = {'video/mp4', 'video/avi', 'video/quicktime', 'video/webm', 'video/x-matroska'}
ALLOWED_DOC_TYPES = {'application/pdf'}
ALLOWED_EXTENSIONS_IMAGE = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
ALLOWED_EXTENSIONS_VIDEO = {'mp4', 'avi', 'mov', 'mkv', 'webm'}
ALLOWED_EXTENSIONS_PDF = {'pdf'}

MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB
MAX_PDF_SIZE = 20 * 1024 * 1024     # 20 MB


def validate_file_extension(filename: str, allowed: set) -> bool:
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[-1].lower()
    return ext in allowed


def validate_file_size(file_stream, max_size: int) -> bool:
    file_stream.seek(0, 2)  # Seek to end
    size = file_stream.tell()
    file_stream.seek(0)  # Reset
    return size <= max_size