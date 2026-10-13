"""Modul auth: login, logout, refresh JWT, pendaftaran mandiri mahasiswa, verifikasi email, reset password.
FR-01, NFR-01."""
import logging
from datetime import datetime, timedelta, timezone

from flask import current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token, get_jwt, get_jwt_identity, jwt_required,
)

from . import auth_bp
from ..extensions import db, limiter
from ..errors import ApiError
from ..models import RevokedToken, User
from ..schemas import EmailIn, LoginIn, RegisterIn, ResetPasswordIn, TokenIn, parse
from ..security import burn_password_check, check_password, current_user, hash_password
from ..services import create_user_with_profile, send_reset_email, send_verification_email
from ..tokens import read_reset_token, read_verify_token, reset_token_matches

log = logging.getLogger("sew.auth")  # tidak mencatat password/token (NFR-09)


def _now():
    return datetime.now(timezone.utc)


def _aware(value):
    """SQLite mengembalikan datetime tanpa zona; anggap UTC."""
    return value if value is None or value.tzinfo else value.replace(tzinfo=timezone.utc)


def _claims(user):
    return {"role": user.role, "nim": user.nim}


def _register_failure(user):
    cfg = current_app.config
    user.failed_logins = (user.failed_logins or 0) + 1
    if user.failed_logins >= cfg["MAX_FAILED_LOGINS"]:
        user.locked_until = _now() + timedelta(minutes=cfg["LOCK_MINUTES"])
        user.failed_logins = 0
        log.warning("akun dikunci id_user=%s", user.id_user)
    db.session.commit()


@auth_bp.post("/login")
@limiter.limit(lambda: current_app.config["LOGIN_RATE_LIMIT"])
def login():
    data = parse(LoginIn, request.get_json(silent=True))
    user = User.query.filter(
        (User.username == data.username) | (User.email == data.username)
    ).first()

    if not user:
        burn_password_check(data.password)
        log.warning("login gagal")
        raise ApiError("KREDENSIAL_SALAH", "Username/email atau password salah.", 401)

    locked_until = _aware(user.locked_until)
    if locked_until and locked_until > _now():
        raise ApiError("AKUN_TERKUNCI", "Terlalu banyak percobaan gagal. Akun dikunci sementara, coba lagi beberapa menit lagi.", 423)

    if not user.is_active or not check_password(data.password, user.password_hash):
        if user.is_active:
            _register_failure(user)
        log.warning("login gagal")
        raise ApiError("KREDENSIAL_SALAH", "Username/email atau password salah.", 401)

    # Password benar; baru sekarang status verifikasi boleh diberitahukan (tidak membocorkan akun orang lain).
    if current_app.config["REQUIRE_EMAIL_VERIFICATION"] and user.email_verified_at is None:
        raise ApiError("EMAIL_BELUM_TERVERIFIKASI", "Email belum diverifikasi. Cek kotak masuk kamu atau kirim ulang tautan verifikasi.", 403)

    user.failed_logins, user.locked_until = 0, None
    db.session.commit()

    identity = str(user.id_user)
    log.info("login berhasil id_user=%s role=%s", user.id_user, user.role)
    return jsonify(
        access_token=create_access_token(identity, additional_claims=_claims(user)),
        refresh_token=create_refresh_token(identity),
        role=user.role,
        user=user.to_dict(),
    ), 200


@auth_bp.post("/logout")
@jwt_required(verify_type=False)
def logout():
    """Cabut token yang dikirim (access atau refresh). Frontend memanggilnya untuk keduanya."""
    claims = get_jwt()
    db.session.add(RevokedToken(jti=claims["jti"], expires_at=datetime.fromtimestamp(claims["exp"], timezone.utc)))
    RevokedToken.query.filter(RevokedToken.expires_at < _now()).delete()
    db.session.commit()
    return jsonify(ok=True), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    """Profil akun yang sedang login (dipakai frontend untuk memulihkan sesi)."""
    return jsonify(current_user().to_dict()), 200


@auth_bp.post("/refresh")
@limiter.limit(lambda: current_app.config["REFRESH_RATE_LIMIT"])
@jwt_required(refresh=True)
def refresh():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not user.is_active:
        raise ApiError("AKUN_NONAKTIF", "Akun tidak aktif. Silakan login ulang.", 401)
    return jsonify(access_token=create_access_token(str(user.id_user), additional_claims=_claims(user))), 200


@auth_bp.post("/register")
@limiter.limit(lambda: current_app.config["REGISTER_RATE_LIMIT"])
def register():
    """Tambahan di luar dokumen: pendaftaran mandiri KHUSUS mahasiswa (matikan: ALLOW_SELF_REGISTER=false)."""
    if not current_app.config["ALLOW_SELF_REGISTER"]:
        raise ApiError("PENDAFTARAN_DITUTUP", "Pendaftaran mandiri dinonaktifkan. Hubungi Admin.", 403)
    data = parse(RegisterIn, request.get_json(silent=True))
    needs_verification = current_app.config["REQUIRE_EMAIL_VERIFICATION"]
    user = create_user_with_profile(
        role="mahasiswa", name=data.name, email=data.email, password=data.password,
        username=data.username, nim=data.nim, prodi=data.prodi, angkatan=data.angkatan,
        verified=not needs_verification,
    )
    if needs_verification:
        send_verification_email(user)
    log.info("register mahasiswa id_user=%s", user.id_user)
    return jsonify({**user.to_dict(), "verification_required": needs_verification}), 201


@auth_bp.post("/verify-email")
@limiter.limit(lambda: current_app.config["EMAIL_RATE_LIMIT"])
def verify_email():
    data = parse(TokenIn, request.get_json(silent=True))
    payload = read_verify_token(data.token)
    user = db.session.get(User, payload.get("id"))
    if not user or user.email != payload.get("email"):
        raise ApiError("TOKEN_TIDAK_VALID", "Tautan verifikasi tidak valid.", 400)
    if user.email_verified_at is None:
        user.email_verified_at = _now()
        db.session.commit()
    return jsonify(ok=True), 200


@auth_bp.post("/resend-verification")
@limiter.limit(lambda: current_app.config["EMAIL_RATE_LIMIT"])
def resend_verification():
    """Selalu menjawab sama (tidak membocorkan apakah email terdaftar)."""
    data = parse(EmailIn, request.get_json(silent=True))
    user = User.query.filter_by(email=data.email).first()
    if user and user.is_active and user.email_verified_at is None:
        send_verification_email(user)
    return jsonify(ok=True, message="Jika email terdaftar dan belum terverifikasi, tautan verifikasi baru sudah dikirim."), 200


@auth_bp.post("/forgot-password")
@limiter.limit(lambda: current_app.config["EMAIL_RATE_LIMIT"])
def forgot_password():
    """Selalu menjawab sama (tidak membocorkan apakah email terdaftar)."""
    data = parse(EmailIn, request.get_json(silent=True))
    user = User.query.filter_by(email=data.email).first()
    if user and user.is_active:
        send_reset_email(user)
    return jsonify(ok=True, message="Jika email terdaftar, tautan reset password sudah dikirim."), 200


@auth_bp.post("/reset-password")
@limiter.limit(lambda: current_app.config["EMAIL_RATE_LIMIT"])
def reset_password():
    data = parse(ResetPasswordIn, request.get_json(silent=True))
    payload = read_reset_token(data.token)
    user = db.session.get(User, payload.get("id"))
    if not user or not user.is_active or not reset_token_matches(user, payload):
        raise ApiError("TOKEN_TIDAK_VALID", "Tautan reset password tidak valid atau sudah dipakai.", 400)
    user.password_hash = hash_password(data.password)
    user.failed_logins, user.locked_until = 0, None
    if user.email_verified_at is None:  # tautan sampai ke kotak surat, jadi email terbukti miliknya
        user.email_verified_at = _now()
    db.session.commit()
    log.info("reset password id_user=%s", user.id_user)
    return jsonify(ok=True), 200
