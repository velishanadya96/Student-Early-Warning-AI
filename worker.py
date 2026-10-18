"""Worker pengiriman WhatsApp (FR-11): mencoba ulang pesan berstatus 'pending' tiap WA_RETRY_INTERVAL detik
(maksimal WA_MAX_RETRY percobaan per pesan, setelah itu 'gagal'). Hanya berguna bila WA_PROVIDER = fonnte / log.
Jalankan:  python worker.py   (di Docker: service 'worker')"""
import logging
import time

from app import create_app
from app.notif import proses_pending

app = create_app()
log = logging.getLogger("worker")

if __name__ == "__main__":
    interval = app.config["WA_RETRY_INTERVAL"]
    log.info("Worker WA aktif (provider=%s, interval=%ss)", app.config["WA_PROVIDER"], interval)
    while True:
        with app.app_context():
            try:
                n = proses_pending()
                if n:
                    log.info("%s pesan WA terkirim", n)
            except Exception:
                log.exception("Worker gagal memproses antrean")
        time.sleep(interval)
