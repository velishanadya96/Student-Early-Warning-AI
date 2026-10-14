"""Verifikasi ID token Google (Google Identity Services). Token ditandatangani Google; kita cek tanda tangan,
masa berlaku, dan audience (Client ID kita) lewat library resmi google-auth."""
import logging

from flask import current_app

from .errors import ApiError

log = logging.getLogger("sew.google")


def google_enabled():
    return bool(current_app.config.get("GOOGLE_CLIENT_ID"))


def verify_google_credential(credential):
    """Return {"email","name","sub"} dari ID token Google yang valid. Raise ApiError kalau tidak valid."""
    client_id = current_app.config.get("GOOGLE_CLIENT_ID")
    if not client_id:
        raise ApiError("GOOGLE_BELUM_DIATUR", "Login Google belum diaktifkan di server.", 503)
    try:
        from google.auth.transport import requests as grequests
        from google.oauth2 import id_token
        info = id_token.verify_oauth2_token(credential, grequests.Request(), client_id, clock_skew_in_seconds=10)
    except Exception:
        log.warning("ID token Google ditolak")
        raise ApiError("GOOGLE_TOKEN_TIDAK_VALID", "Login Google gagal atau sudah kedaluwarsa. Coba lagi.", 401)
    if not info.get("email") or not info.get("email_verified"):
        raise ApiError("GOOGLE_EMAIL_BELUM_VERIFIKASI", "Email akun Google ini belum terverifikasi oleh Google.", 401)
    return {"email": info["email"].strip().lower(), "name": (info.get("name") or "").strip(), "sub": info.get("sub")}
