#!/bin/sh
# Terapkan migrasi database sebelum API menerima request.
set -e
echo "Menjalankan migrasi database..."
FLASK_APP=run.py flask db upgrade
exec "$@"
