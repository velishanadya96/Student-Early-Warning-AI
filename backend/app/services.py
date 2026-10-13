"""Lapisan service: logika bisnis akun (dipakai auth & users)."""
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError

from .extensions import db
from .errors import ApiError
from .models import User, DosenPA, Mahasiswa, OrangTua
from .security import hash_password


def create_user_with_profile(*, role, name, email, password, username=None, nim=None,
                             nidn=None, prodi=None, angkatan=None, verified=True):
    if User.query.filter_by(email=email).first():
        raise ApiError("EMAIL_SUDAH_ADA", "Email sudah terdaftar. Silakan masuk.", 409)
    if username:
        username = username.strip().lower()
        if User.query.filter_by(username=username).first():
            raise ApiError("USERNAME_SUDAH_ADA", "Username sudah dipakai.", 409)
    else:
        # Username otomatis dari email; kalau bentrok (mis. budi@student... dan budi@example.com) beri nomor.
        base = email.split("@")[0].strip().lower()[:45]
        username, n = base, 1
        while User.query.filter_by(username=username).first():
            n += 1
            username = f"{base}{n}"
    if role == "mahasiswa" and Mahasiswa.query.filter_by(nim=nim).first():
        raise ApiError("NIM_SUDAH_ADA", "NIM sudah terdaftar.", 409)
    if role == "orangtua" and not Mahasiswa.query.filter_by(nim=nim).first():
        raise ApiError("TIDAK_DITEMUKAN", "Mahasiswa dengan NIM tersebut belum terdaftar.", 404)
    if role == "dosen" and DosenPA.query.filter_by(nidn=nidn).first():
        raise ApiError("NIDN_SUDAH_ADA", "NIDN sudah terdaftar.", 409)

    user = User(username=username, email=email, role=role, password_hash=hash_password(password),
                email_verified_at=datetime.now(timezone.utc) if verified else None)
    db.session.add(user)
    db.session.flush()  # dapat id_user
    if role == "mahasiswa":
        db.session.add(Mahasiswa(nim=nim, id_user=user.id_user, nama=name, prodi=prodi, angkatan=angkatan))
    elif role == "orangtua":
        db.session.add(OrangTua(id_user=user.id_user, nim=nim, nama=name))
    elif role == "dosen":
        db.session.add(DosenPA(id_user=user.id_user, nidn=nidn, nama=name, prodi=prodi))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ApiError("DATA_DUPLIKAT", "Email, username, atau NIM sudah terdaftar.", 409)
    return user


def send_verification_email(user) -> bool:
    from flask import current_app
    from .mailer import send_email
    from .tokens import make_verify_token

    link = f"{current_app.config['FRONTEND_URL']}/verify-email?token={make_verify_token(user)}"
    hours = current_app.config["VERIFY_TOKEN_HOURS"]
    return send_email(
        user.email,
        "Verifikasi email Student Early Warning",
        f"Halo {user.display_name},\n\nKlik tautan berikut untuk memverifikasi email kamu (berlaku {hours} jam):\n{link}\n\n"
        "Kalau kamu tidak mendaftar, abaikan email ini.",
    )


def send_reset_email(user) -> bool:
    from flask import current_app
    from .mailer import send_email
    from .tokens import make_reset_token

    link = f"{current_app.config['FRONTEND_URL']}/reset-password?token={make_reset_token(user)}"
    minutes = current_app.config["RESET_TOKEN_MINUTES"]
    return send_email(
        user.email,
        "Reset password Student Early Warning",
        f"Halo {user.display_name},\n\nKlik tautan berikut untuk membuat password baru (berlaku {minutes} menit, sekali pakai):\n{link}\n\n"
        "Kalau kamu tidak meminta reset password, abaikan email ini; password kamu tidak berubah.",
    )
