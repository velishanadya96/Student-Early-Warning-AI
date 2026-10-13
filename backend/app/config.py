import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# Secret bawaan HANYA untuk development; production wajib mengisi JWT_SECRET_KEY sendiri.
_DEV_SECRET = "dev-only-jangan-dipakai-di-produksi-0123456789"
APP_ENV = os.getenv("APP_ENV", "production").lower()  # development | production | testing


class Config:
    APP_ENV = APP_ENV
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///sew.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or (_DEV_SECRET if APP_ENV != "production" else "")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)   # NFR-01
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)      # NFR-01

    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]
    ALLOW_SELF_REGISTER = os.getenv("ALLOW_SELF_REGISTER", "true").lower() == "true"
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    LOGIN_RATE_LIMIT = "10 per minute"
    REGISTER_RATE_LIMIT = "5 per minute"
    REFRESH_RATE_LIMIT = "30 per minute"
    EMAIL_RATE_LIMIT = "5 per minute"           # kirim ulang verifikasi / lupa password

    # Jumlah proxy tepercaya di depan API (mis. 1 bila di belakang frontend/Nginx). 0 = abaikan X-Forwarded-For.
    TRUSTED_PROXIES = int(os.getenv("TRUSTED_PROXIES", "0"))

    # Penguncian akun setelah salah password berulang
    MAX_FAILED_LOGINS = int(os.getenv("MAX_FAILED_LOGINS", "5"))
    LOCK_MINUTES = int(os.getenv("LOCK_MINUTES", "15"))

    # Verifikasi email dan reset password
    REQUIRE_EMAIL_VERIFICATION = os.getenv("REQUIRE_EMAIL_VERIFICATION", "true").lower() == "true"
    VERIFY_TOKEN_HOURS = 24
    RESET_TOKEN_MINUTES = 60
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    # SMTP. MAIL_HOST kosong = email tidak dikirim, hanya dicatat di log (development).
    MAIL_HOST = os.getenv("MAIL_HOST", "")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USER = os.getenv("MAIL_USER", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_FROM = os.getenv("MAIL_FROM", "Student Early Warning <no-reply@sew.local>")


def validate_config(config):
    """Gagal cepat kalau konfigurasi production tidak aman."""
    if config.get("APP_ENV") != "production" or config.get("TESTING"):
        return
    secret = config.get("JWT_SECRET_KEY") or ""
    if len(secret) < 32 or secret.startswith(("dev-only", "ganti")):
        raise RuntimeError(
            "JWT_SECRET_KEY belum diisi dengan benar. Isi dengan string acak minimal 32 karakter "
            "(contoh: python -c \"import secrets; print(secrets.token_urlsafe(48))\"), "
            "atau set APP_ENV=development untuk lingkungan lokal."
        )
