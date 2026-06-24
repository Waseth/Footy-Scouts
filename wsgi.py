"""
wsgi.py
───────
WSGI entry point for production deployment (Gunicorn on Render).

Gunicorn command (set in render.yaml / Render dashboard):
    gunicorn wsgi:application --workers 4 --worker-class sync --timeout 120 --bind 0.0.0.0:$PORT

Why this file exists separately from run.py:
  - run.py starts Flask's built-in dev server (not suitable for production)
  - wsgi.py exposes the WSGI `application` callable that Gunicorn uses
  - Gunicorn manages workers, timeouts, and restarts — not Flask
"""
import os
from app import create_app

# Always use production config on Render (FLASK_ENV=production in env vars)
application = create_app(os.environ.get('FLASK_ENV', 'production'))

# Alias so both `gunicorn wsgi:app` and `gunicorn wsgi:application` work
app = application