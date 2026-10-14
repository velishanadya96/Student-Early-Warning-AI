"""Pengiriman email verifikasi. SMTP_HOST kosong -> tautan dicetak ke log (mode dev) dan disimpan di OUTBOX (untuk tes)."""
import logging
import smtplib
from email.message import EmailMessage

from flask import current_app

log = logging.getLogger("sew.mail")
OUTBOX = []  # hanya diisi saat TESTING / mode dev tanpa SMTP


def send_verification_email(to_email, name, link):
    subject = "Verifikasi email akun Student Early Warning AI"
    body = (
        f"Halo {name},\n\n"
        "Terima kasih sudah mendaftar. Klik tautan berikut untuk memverifikasi email kamu "
        f"(berlaku {current_app.config['VERIFY_TOKEN_HOURS']} jam):\n\n{link}\n\n"
        "Kalau kamu tidak merasa mendaftar, abaikan email ini."
    )
    cfg = current_app.config
    if not cfg["SMTP_HOST"]:
        OUTBOX.append({"to": to_email, "subject": subject, "link": link})
        del OUTBOX[:-50]
        log.warning("[MODE DEV - SMTP belum diatur] Tautan verifikasi untuk %s: %s", to_email, link)
        return True
    msg = EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = subject, cfg["MAIL_FROM"], to_email
    msg.set_content(body)
    try:
        with smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=15) as s:
            s.starttls()
            if cfg["SMTP_USER"]:
                s.login(cfg["SMTP_USER"], cfg["SMTP_PASSWORD"])
            s.send_message(msg)
        return True
    except Exception:  # jangan menggagalkan pendaftaran; user bisa kirim ulang
        log.exception("gagal mengirim email verifikasi")
        return False
