"""Pengiriman email lewat SMTP. Tanpa MAIL_HOST, email hanya dicatat di log (development).
Saat TESTING, email ditampung di `outbox` agar bisa diperiksa tes."""
import logging
import smtplib
from email.message import EmailMessage

from flask import current_app

log = logging.getLogger("sew.mail")
outbox: list[dict] = []


def send_email(to: str, subject: str, text: str) -> bool:
    """Kembalikan True kalau terkirim/tercatat. Kegagalan SMTP tidak melempar error ke pengguna."""
    cfg = current_app.config
    if cfg.get("TESTING"):
        outbox.append({"to": to, "subject": subject, "text": text})
        return True
    if not cfg["MAIL_HOST"]:
        log.warning("MAIL_HOST kosong, email tidak dikirim. Ke=%s Subjek=%s\n%s", to, subject, text)
        return True

    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = cfg["MAIL_FROM"], to, subject
    msg.set_content(text)
    try:
        with smtplib.SMTP(cfg["MAIL_HOST"], cfg["MAIL_PORT"], timeout=10) as smtp:
            if cfg["MAIL_USE_TLS"]:
                smtp.starttls()
            if cfg["MAIL_USER"]:
                smtp.login(cfg["MAIL_USER"], cfg["MAIL_PASSWORD"])
            smtp.send_message(msg)
        return True
    except (OSError, smtplib.SMTPException):
        log.exception("Gagal mengirim email ke %s", to)
        return False
