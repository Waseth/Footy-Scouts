"""
run.py
──────
Development server entry point.

Usage:
    python run.py

For production use wsgi.py with gunicorn instead (see render.yaml).
"""
import os
from app import create_app

app = create_app(os.environ.get('FLASK_ENV', 'development'))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'

    print(f"\n🚀  Footy Scout API starting on http://0.0.0.0:{port}")
    print(f"    Environment : {os.environ.get('FLASK_ENV', 'development')}")
    print(f"    Debug mode  : {debug}\n")

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
    )