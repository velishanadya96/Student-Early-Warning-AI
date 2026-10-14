#!/bin/sh
# Dijalankan saat container api start: tunggu database, buat/upgrade tabel, (opsional) isi akun demo, lalu jalankan server.
set -e

python - <<'PY'
import os, sys, time
from sqlalchemy import create_engine, text

url = os.environ["DATABASE_URL"]
for attempt in range(1, 61):
    try:
        with create_engine(url).connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[entrypoint] database siap (percobaan {attempt})", flush=True)
        break
    except Exception as exc:  # database belum siap menerima koneksi
        print(f"[entrypoint] menunggu database... ({exc.__class__.__name__})", flush=True)
        time.sleep(2)
else:
    sys.exit("[entrypoint] database tidak bisa dihubungi setelah 2 menit")
PY

echo "[entrypoint] menjalankan migrasi (flask db upgrade)"
flask --app run db upgrade

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "[entrypoint] mengisi akun demo (python seed.py, aman diulang)"
  python seed.py
fi

exec gunicorn -b 0.0.0.0:5000 --access-logfile - run:app
