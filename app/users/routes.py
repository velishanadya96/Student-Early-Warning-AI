"""Modul users (Admin): kelola akun & penugasan Dosen PA. FR-12."""
import logging
from flask import jsonify, request

from . import users_bp
from ..extensions import db
from ..errors import ApiError
from ..models import User, DosenPA, Mahasiswa
from ..schemas import SSO_DOMAIN, AssignDosenIn, UserCreateIn, UserUpdateIn, parse
from ..security import hash_password, roles_required
from ..services import create_user_with_profile

log = logging.getLogger("sew.users")


def _get_user(id_user):
    user = db.session.get(User, id_user)
    if not user:
        raise ApiError("TIDAK_DITEMUKAN", "Pengguna tidak ditemukan.", 404)
    return user


@users_bp.get("")
@roles_required("admin")
def list_users():
    return jsonify([u.to_dict() for u in User.query.order_by(User.id_user).all()])


@users_bp.post("")
@roles_required("admin")
def create_user():
    d = parse(UserCreateIn, request.get_json(silent=True))
    user = create_user_with_profile(
        role=d.role, name=d.name, email=d.email, password=d.password, username=d.username,
        nim=d.nim, nidn=d.nidn, prodi=d.prodi, angkatan=d.angkatan, no_wa=d.no_wa,
    )
    log.info("admin membuat akun id_user=%s role=%s", user.id_user, user.role)
    return jsonify(user.to_dict()), 201


@users_bp.put("/<int:id_user>")
@roles_required("admin")
def update_user(id_user):
    user = _get_user(id_user)
    d = parse(UserUpdateIn, request.get_json(silent=True))
    if d.email and d.email != user.email:
        if user.role != "orangtua" and not d.email.endswith(SSO_DOMAIN):
            raise ApiError("VALIDASI_GAGAL", f"Email harus menggunakan format nama{SSO_DOMAIN}.", 422)
        if User.query.filter_by(email=d.email).first():
            raise ApiError("EMAIL_SUDAH_ADA", "Email sudah terdaftar.", 409)
        user.email = d.email
    if d.name:
        profile = user.mahasiswa or user.dosen_pa or user.orang_tua
        if profile:
            profile.nama = d.name.strip()
    if d.no_wa:
        if user.role not in ("dosen", "orangtua"):
            raise ApiError("VALIDASI_GAGAL", "Nomor WhatsApp hanya untuk akun Dosen PA dan orang tua.", 422)
        (user.dosen_pa or user.orang_tua).no_wa = d.no_wa
    if d.password:
        user.password_hash = hash_password(d.password)
    if d.is_active is not None:
        user.is_active = d.is_active
    db.session.commit()
    log.info("admin mengubah akun id_user=%s", id_user)
    return jsonify(user.to_dict())


@users_bp.delete("/<int:id_user>")
@roles_required("admin")
def deactivate_user(id_user):
    user = _get_user(id_user)  # DELETE = nonaktifkan, bukan hapus
    user.is_active = False
    db.session.commit()
    log.info("admin menonaktifkan akun id_user=%s", id_user)
    return jsonify(user.to_dict())


@users_bp.patch("/mahasiswa/<nim>/dosen-pa")
@roles_required("admin")
def assign_dosen(nim):
    mhs = db.session.get(Mahasiswa, nim)
    if not mhs:
        raise ApiError("TIDAK_DITEMUKAN", "Mahasiswa tidak ditemukan.", 404)
    d = parse(AssignDosenIn, request.get_json(silent=True))
    if not db.session.get(DosenPA, d.id_dosen_pa):
        raise ApiError("TIDAK_DITEMUKAN", "Dosen PA tidak ditemukan.", 404)
    mhs.id_dosen_pa = d.id_dosen_pa
    db.session.commit()
    return jsonify(nim=mhs.nim, id_dosen_pa=mhs.id_dosen_pa)
