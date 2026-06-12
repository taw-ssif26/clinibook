#!/bin/bash
set -e  # Exit if any command fails

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
# 'exec' replaces the shell process with the uvicorn process, 
# ensuring signals like SIGTERM are passed to the app correctly.
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
