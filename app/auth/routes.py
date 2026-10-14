"""Modul auth: login, refresh JWT, (opsional) pendaftaran mandiri mahasiswa. FR-01, NFR-01."""
import logging
from datetime import datetime, timedelta, timezone
from flask import current_app, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required

from . import auth_bp
from ..extensions import db, limiter
from ..errors import ApiError
from ..models import Mahasiswa, OrangTua, RosterMahasiswa, User
from ..schemas import (GoogleCredentialIn, LoginIn, LoginOrtuIn, RegisterGoogleIn, RegisterIn, RegisterOrtuIn,
                       ResendIn, VerifyEmailIn, domain_error, parse)
from ..security import check_password
from ..google import google_enabled, verify_google_credential
from ..services import create_user_with_profile, issue_verification, verify_email_token

log = logging.getLogger("sew.auth")  # tidak mencatat password/token (NFR-09)


def _claims(user):
    return {"role": user.role, "nim": user.nim}


def _aware(dt):
    return dt.replace(tzinfo=timezone.utc) if dt is not None and dt.tzinfo is None else dt


def _authenticate(user, password, fail_code, fail_msg):
    """Cek password + penguncian akun + status verifikasi email. Return user bila lolos, kalau tidak raise ApiError."""
    now = datetime.now(timezone.utc)
    if user:
        locked = _aware(user.locked_until)
        if locked and locked > now:
            menit = int((locked - now).total_seconds() // 60) + 1
            log.warning("login ditolak (akun terkunci) id_user=%s", user.id_user)
            raise ApiError("AKUN_TERKUNCI", f"Terlalu banyak percobaan gagal. Akun dikunci, coba lagi dalam {menit} menit.", 423)
    ok = bool(user and user.is_active and check_password(password, user.password_hash))
    if not ok:
        if user:
            user.failed_logins = (user.failed_logins or 0) + 1
            if user.failed_logins >= current_app.config["MAX_FAILED_LOGINS"]:
                user.locked_until = now + timedelta(minutes=current_app.config["LOCKOUT_MINUTES"])
                user.failed_logins = 0
                log.warning("akun dikunci id_user=%s", user.id_user)
            db.session.commit()
        log.warning("login gagal")
        raise ApiError(fail_code, fail_msg, 401)
    if not user.email_verified:
        raise ApiError("EMAIL_BELUM_TERVERIFIKASI", "Email belum diverifikasi. Cek kotak masuk (atau folder spam) lalu klik tautan verifikasi.", 403)
    user.failed_logins = 0
    user.locked_until = None
    db.session.commit()
    return user


@auth_bp.post("/login")
@limiter.limit(lambda: current_app.config["LOGIN_RATE_LIMIT"])
def login():
    data = parse(LoginIn, request.get_json(silent=True))
    user = User.query.filter(
        (User.username == data.username) | (User.email == data.username)
    ).first()

    user = _authenticate(user, data.password, "KREDENSIAL_SALAH", "Username/email atau password salah.")

    identity = str(user.id_user)
    log.info("login berhasil id_user=%s role=%s", user.id_user, user.role)
    return jsonify(
        access_token=create_access_token(identity, additional_claims=_claims(user)),
        refresh_token=create_refresh_token(identity),
        role=user.role,
        user=user.to_dict(),
    ), 200


@auth_bp.post("/login-ortu")
@limiter.limit(lambda: current_app.config["LOGIN_RATE_LIMIT"])
def login_ortu():
    """Login Orang Tua: NIM anak + email anak (verifikasi relasi) + password milik orang tua."""
    data = parse(LoginOrtuIn, request.get_json(silent=True))
    user = None
    mhs = db.session.get(Mahasiswa, data.nim)
    if mhs and mhs.user.email == data.email:
        ortu = OrangTua.query.filter_by(nim=mhs.nim).first()
        user = ortu.user if ortu else None

    # Pesan sama untuk semua kegagalan (tidak membocorkan NIM/email mana yang benar).
    user = _authenticate(user, data.password, "KREDENSIAL_SALAH", "NIM, email mahasiswa, atau password salah.")

    identity = str(user.id_user)
    log.info("login orang tua berhasil id_user=%s", user.id_user)
    return jsonify(
        access_token=create_access_token(identity, additional_claims=_claims(user)),
        refresh_token=create_refresh_token(identity),
        role=user.role,
        user=user.to_dict(),
    ), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    """Siapa pemegang token ini? Dipakai middleware front-end untuk memverifikasi sesi (role dari server, bukan cookie)."""
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not user.is_active:
        raise ApiError("AKUN_NONAKTIF", "Akun tidak aktif. Silakan login ulang.", 401)
    return jsonify(user.to_dict()), 200


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not user.is_active:
        raise ApiError("AKUN_NONAKTIF", "Akun tidak aktif. Silakan login ulang.", 401)
    return jsonify(access_token=create_access_token(str(user.id_user), additional_claims=_claims(user))), 200


@auth_bp.get("/config")
def public_config():
    """Konfigurasi publik untuk front-end: apakah login/daftar Google aktif, dan Client ID-nya (bukan rahasia)."""
    on = google_enabled()
    return jsonify(
        google_enabled=on,
        google_client_id=current_app.config["GOOGLE_CLIENT_ID"] if on else None,
        register_requires_google=on,
        allowed_email_domains=current_app.config["ALLOWED_EMAIL_DOMAINS"],
        roster_active=RosterMahasiswa.query.count() > 0,
    ), 200


def _tokens_response(user):
    identity = str(user.id_user)
    return jsonify(
        access_token=create_access_token(identity, additional_claims=_claims(user)),
        refresh_token=create_refresh_token(identity),
        role=user.role,
        user=user.to_dict(),
    ), 200


@auth_bp.post("/google")
@limiter.limit(lambda: current_app.config["LOGIN_RATE_LIMIT"])
def login_google():
    """Masuk dengan Google. Hanya untuk email yang SUDAH terdaftar; akun Google yang belum terdaftar ditolak."""
    d = parse(GoogleCredentialIn, request.get_json(silent=True))
    info = verify_google_credential(d.credential)
    user = User.query.filter_by(email=info["email"]).first()
    if not user:
        raise ApiError("GOOGLE_BELUM_TERDAFTAR", "Akun Google ini belum terdaftar di sistem. Silakan daftar dulu.", 404)
    if not user.is_active:
        raise ApiError("AKUN_NONAKTIF", "Akun tidak aktif. Hubungi Admin.", 401)
    if not user.email_verified:  # Google sudah memverifikasi kepemilikan email ini
        user.email_verified = True
        user.verify_token_hash = None
        user.verify_expires_at = None
    user.failed_logins = 0
    user.locked_until = None
    db.session.commit()
    log.info("login google berhasil id_user=%s role=%s", user.id_user, user.role)
    return _tokens_response(user)


@auth_bp.post("/google/preview")
@limiter.limit(lambda: current_app.config["LOGIN_RATE_LIMIT"])
def google_preview():
    """Langkah 1 pendaftaran: verifikasi akun Google, balas email + nama (+ NIM dari roster bila email-nya dikenal)."""
    d = parse(GoogleCredentialIn, request.get_json(silent=True))
    info = verify_google_credential(d.credential)
    roster = RosterMahasiswa.query.filter(RosterMahasiswa.email == info["email"]).first()
    return jsonify(
        email=info["email"], name=info["name"],
        already_registered=User.query.filter_by(email=info["email"]).first() is not None,
        nim=roster.nim if roster else None,
        nama_resmi=roster.nama if roster else None,
        domain_error=domain_error(info["email"]),
    ), 200


@auth_bp.post("/register")
def register():
    """Pendaftaran mandiri KHUSUS mahasiswa (matikan: ALLOW_SELF_REGISTER=false).
    Google aktif  -> wajib akun Google yang valid (+ NIM; cocok dengan roster bila roster diisi), email otomatis terverifikasi.
    Google nonaktif -> cara lama: email + verifikasi lewat tautan."""
    if not current_app.config["ALLOW_SELF_REGISTER"]:
        raise ApiError("PENDAFTARAN_DITUTUP", "Pendaftaran mandiri dinonaktifkan. Hubungi Admin.", 403)
    body = request.get_json(silent=True) or {}

    if google_enabled():
        if not body.get("credential"):
            raise ApiError("GOOGLE_WAJIB", "Pendaftaran wajib memakai akun Google. Klik tombol 'Daftar dengan Google'.", 400)
        d = parse(RegisterGoogleIn, body)
        info = verify_google_credential(d.credential)
        msg = domain_error(info["email"])
        if msg:
            raise ApiError("DOMAIN_TIDAK_DIIZINKAN", msg, 422)
        name, prodi, angkatan = d.name or info["name"], d.prodi, d.angkatan
        if RosterMahasiswa.query.count() > 0:  # ada data resmi -> NIM wajib terdaftar
            r = db.session.get(RosterMahasiswa, d.nim)
            if not r:
                raise ApiError("NIM_TIDAK_TERDAFTAR", "NIM tidak ditemukan di data mahasiswa. Periksa NIM atau hubungi Admin.", 422)
            if r.email and r.email.lower() != info["email"]:
                raise ApiError("EMAIL_TIDAK_COCOK", "Akun Google ini tidak sesuai dengan email yang terdaftar untuk NIM tersebut.", 422)
            name, prodi, angkatan = r.nama, r.prodi or prodi, r.angkatan or angkatan
        if not name or len(name) < 3:
            raise ApiError("VALIDASI_GAGAL", "Nama lengkap minimal 3 karakter.", 422)
        user = create_user_with_profile(
            role="mahasiswa", name=name, email=info["email"], password=d.password,
            nim=d.nim, prodi=prodi, angkatan=angkatan, self_register=False,  # email sudah diverifikasi Google
        )
        log.info("register mahasiswa via google id_user=%s", user.id_user)
        return jsonify({**user.to_dict(), "verification_required": False, "google": True}), 201

    data = parse(RegisterIn, body)
    user = create_user_with_profile(
        role="mahasiswa", name=data.name, email=data.email, password=data.password,
        username=data.username, nim=data.nim, prodi=data.prodi, angkatan=data.angkatan, self_register=True,
    )
    log.info("register mahasiswa id_user=%s", user.id_user)
    sent = None if user.email_verified else issue_verification(user)
    return jsonify({**user.to_dict(), "verification_required": not user.email_verified, "verification_sent": sent}), 201


@auth_bp.post("/register-ortu")
@limiter.limit(lambda: current_app.config["LOGIN_RATE_LIMIT"])
def register_ortu():
    """Pendaftaran mandiri orang tua. Verifikasi: NIM + email mahasiswa harus cocok. Satu mahasiswa = satu akun orang tua."""
    if not current_app.config["ALLOW_SELF_REGISTER"]:
        raise ApiError("PENDAFTARAN_DITUTUP", "Pendaftaran mandiri dinonaktifkan. Hubungi Admin.", 403)
    d = parse(RegisterOrtuIn, request.get_json(silent=True))
    mhs = db.session.get(Mahasiswa, d.nim)
    if not mhs or mhs.user.email != d.email_mahasiswa:
        raise ApiError("VERIFIKASI_GAGAL", "NIM dan email mahasiswa tidak cocok.", 422)
    user = create_user_with_profile(
        role="orangtua", name=d.name, email=d.email, password=d.password, nim=d.nim, no_wa=d.no_wa,
        self_register=True,
    )
    log.info("register orang tua id_user=%s", user.id_user)
    sent = None if user.email_verified else issue_verification(user)
    return jsonify({**user.to_dict(), "verification_required": not user.email_verified, "verification_sent": sent}), 201


@auth_bp.post("/verify-email")
@limiter.limit(lambda: current_app.config["LOGIN_RATE_LIMIT"])
def verify_email():
    data = parse(VerifyEmailIn, request.get_json(silent=True))
    user = verify_email_token(data.token)
    log.info("email terverifikasi id_user=%s", user.id_user)
    return jsonify(message="Email berhasil diverifikasi. Silakan masuk.", email=user.email), 200


@auth_bp.post("/resend-verification")
@limiter.limit("3 per minute")
def resend_verification():
    """Selalu membalas 200 dengan pesan sama (tidak membocorkan email mana yang terdaftar)."""
    data = parse(ResendIn, request.get_json(silent=True))
    if data.nim:  # orang tua: NIM + email mahasiswa -> akun orang tua dari mahasiswa itu
        mhs = db.session.get(Mahasiswa, data.nim.strip())
        ortu = OrangTua.query.filter_by(nim=mhs.nim).first() if mhs and mhs.user.email == data.email else None
        user = ortu.user if ortu else None
    else:
        user = User.query.filter_by(email=data.email).first()
    if user and user.is_active and not user.email_verified:
        issue_verification(user)
    return jsonify(message="Jika email terdaftar dan belum terverifikasi, tautan baru sudah dikirim."), 200
