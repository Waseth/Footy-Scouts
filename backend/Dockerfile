FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=run.py \
    FLASK_ENV=production

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "wsgi:application", "--workers", "2", "--timeout", "120", "--bind", "0.0.0.0:$PORT"]