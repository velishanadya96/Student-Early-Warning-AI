import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///sew.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-ganti-di-produksi-minimal-32-karakter")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)   # NFR-01
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)      # NFR-01

    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")]
    ALLOW_SELF_REGISTER = os.getenv("ALLOW_SELF_REGISTER", "true").lower() == "true"
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = "memory://"
    LOGIN_RATE_LIMIT = os.getenv("LOGIN_RATE_LIMIT", "30 per minute")  # login lewat Next: semua pengguna terlihat dari 1 IP

    # Verifikasi email. Kalau SMTP_HOST kosong, tautan verifikasi dicetak di terminal Flask (mode dev).
    EMAIL_VERIFICATION_REQUIRED = os.getenv("EMAIL_VERIFICATION_REQUIRED", "true").lower() == "true"
    VERIFY_TOKEN_HOURS = int(os.getenv("VERIFY_TOKEN_HOURS", "24"))
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    MAIL_FROM = os.getenv("MAIL_FROM", "Student Early Warning AI <no-reply@sew.local>")

    # Penguncian akun setelah login salah berulang (per akun, di luar rate limit per IP).
    MAX_FAILED_LOGINS = int(os.getenv("MAX_FAILED_LOGINS", "5"))
    LOCKOUT_MINUTES = int(os.getenv("LOCKOUT_MINUTES", "15"))

    # Login/daftar dengan Google. Isi GOOGLE_CLIENT_ID (OAuth Client ID tipe "Web application") untuk mengaktifkan.
    # Kalau kosong: tombol Google disembunyikan dan pendaftaran memakai verifikasi email lewat tautan.
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()

    # Domain email yang boleh dipakai akun mahasiswa/dosen/kaprodi/admin, dipisah koma. Kosong = semua domain.
    # Contoh: ALLOWED_EMAIL_DOMAINS=student.uns.ac.id,uns.ac.id
    ALLOWED_EMAIL_DOMAINS = [d.strip().lower().lstrip("@") for d in os.getenv("ALLOWED_EMAIL_DOMAINS", "").split(",") if d.strip()]

    # Model risiko (Random Forest 4 fitur). Dimuat sekali dari lokasi tepercaya di server, tidak pernah dari unggahan pengguna.
    MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "model_final.pkl"))
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # batas ukuran file impor

    # Notifikasi WhatsApp ke orang tua saat risiko menjadi High (FR-11).
    #   manual : pesan disiapkan, Dosen PA menekan tombol "Kirim WhatsApp" (membuka WhatsApp dengan pesan siap kirim)
    #   fonnte : dikirim otomatis lewat gateway Fonnte (isi FONNTE_TOKEN)
    #   log    : hanya dicatat di log dan ditandai terkirim (untuk uji coba)
    WA_PROVIDER = os.getenv("WA_PROVIDER", "manual").lower()
    FONNTE_TOKEN = os.getenv("FONNTE_TOKEN", "")
    WA_MAX_RETRY = int(os.getenv("WA_MAX_RETRY", "3"))
    WA_RETRY_INTERVAL = int(os.getenv("WA_RETRY_INTERVAL", "300"))  # detik, dipakai worker.py
