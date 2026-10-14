"""Lapisan service: logika bisnis akun (dipakai auth & users)."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from flask import current_app
from sqlalchemy.exc import IntegrityError

from .extensions import db
from .errors import ApiError
from .models import User, DosenPA, Mahasiswa, OrangTua
from .security import hash_password


def create_user_with_profile(*, role, name, email, password, username=None, nim=None,
                             nidn=None, prodi=None, angkatan=None, no_wa=None, self_register=False):
    default_username = f"ortu-{nim}" if role == "orangtua" else email.split("@")[0]
    username = (username or default_username).strip().lower()
    if User.query.filter_by(email=email).first():
        raise ApiError("EMAIL_SUDAH_ADA", "Email sudah terdaftar. Silakan masuk.", 409)
    if User.query.filter_by(username=username).first():
        raise ApiError("USERNAME_SUDAH_ADA", "Username sudah dipakai.", 409)
    if role == "mahasiswa" and Mahasiswa.query.filter_by(nim=nim).first():
        raise ApiError("NIM_SUDAH_ADA", "NIM sudah terdaftar.", 409)
    if role == "orangtua" and not Mahasiswa.query.filter_by(nim=nim).first():
        raise ApiError("TIDAK_DITEMUKAN", "Mahasiswa dengan NIM tersebut belum terdaftar.", 404)
    if role == "orangtua" and OrangTua.query.filter_by(nim=nim).first():
        raise ApiError("ORTU_SUDAH_ADA", "Mahasiswa ini sudah memiliki akun orang tua.", 409)
    if role == "dosen" and DosenPA.query.filter_by(nidn=nidn).first():
        raise ApiError("NIDN_SUDAH_ADA", "NIDN sudah terdaftar.", 409)

    # Pendaftaran mandiri wajib verifikasi email (kecuali dimatikan lewat EMAIL_VERIFICATION_REQUIRED=false).
    need_verify = self_register and current_app.config["EMAIL_VERIFICATION_REQUIRED"]
    user = User(username=username, email=email, role=role, password_hash=hash_password(password),
                email_verified=not need_verify)
    db.session.add(user)
    db.session.flush()  # dapat id_user
    if role == "mahasiswa":
        db.session.add(Mahasiswa(nim=nim, id_user=user.id_user, nama=name, prodi=prodi, angkatan=angkatan))
    elif role == "orangtua":
        db.session.add(OrangTua(id_user=user.id_user, nim=nim, nama=name, no_wa=no_wa))
    elif role == "dosen":
        db.session.add(DosenPA(id_user=user.id_user, nidn=nidn, nama=name, prodi=prodi, no_wa=no_wa))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ApiError("DATA_DUPLIKAT", "Email, username, atau NIM sudah terdaftar.", 409)
    return user


def _hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def issue_verification(user):
    """Buat token baru (token lama otomatis tidak berlaku) lalu kirim emailnya. Return True bila terkirim."""
    from .mailer import send_verification_email
    token = secrets.token_urlsafe(32)
    user.verify_token_hash = _hash_token(token)
    user.verify_expires_at = datetime.now(timezone.utc) + timedelta(hours=current_app.config["VERIFY_TOKEN_HOURS"])
    db.session.commit()
    link = f"{current_app.config['FRONTEND_URL']}/verify-email?token={token}"
    return send_verification_email(user.email, user.display_name, link)


def verify_email_token(token):
    user = User.query.filter_by(verify_token_hash=_hash_token(token)).first() if token else None
    if not user:
        raise ApiError("TOKEN_VERIFIKASI_TIDAK_VALID", "Tautan verifikasi tidak valid atau sudah dipakai.", 400)
    exp = user.verify_expires_at
    if exp is not None and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if not exp or exp < datetime.now(timezone.utc):
        raise ApiError("TOKEN_VERIFIKASI_KEDALUWARSA", "Tautan verifikasi sudah kedaluwarsa. Minta tautan baru.", 400)
    user.email_verified = True
    user.verify_token_hash = None
    user.verify_expires_at = None
    db.session.commit()
    return user
