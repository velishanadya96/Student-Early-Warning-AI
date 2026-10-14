"""Kontak WhatsApp lintas peran (tanpa menyalin data: diambil lewat relasi).

Dosen PA   -> melihat no WA orang tua mahasiswa bimbingannya   (GET /kontak/ortu)
Orang tua  -> melihat no WA Dosen PA anaknya                   (GET /kontak/dosen-pa)
Relasi: orang_tua.nim -> mahasiswa.id_dosen_pa -> dosen_pa.no_wa
"""
from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from . import kontak_bp
from ..extensions import db
from ..errors import ApiError
from ..models import User, Mahasiswa, OrangTua
from ..security import roles_required


def _current_user():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not user.is_active:
        raise ApiError("AKUN_NONAKTIF", "Akun tidak aktif. Silakan login ulang.", 401)
    return user


@kontak_bp.get("/ortu")
@roles_required("dosen")
def kontak_ortu():
    """Daftar mahasiswa bimbingan beserta kontak WA orang tuanya (kepemilikan: hanya bimbingan sendiri)."""
    dosen = _current_user().dosen_pa
    if not dosen:
        raise ApiError("TIDAK_DITEMUKAN", "Profil Dosen PA tidak ditemukan.", 404)
    hasil = []
    for m in Mahasiswa.query.filter_by(id_dosen_pa=dosen.id_dosen_pa).order_by(Mahasiswa.nim).all():
        ortu = OrangTua.query.filter_by(nim=m.nim).first()
        hasil.append({
            "nim": m.nim,
            "nama_mahasiswa": m.nama,
            "orang_tua": ortu.nama if ortu else None,
            "no_wa_orang_tua": ortu.no_wa if ortu else None,
        })
    return jsonify(hasil)


@kontak_bp.get("/dosen-pa")
@roles_required("orangtua")
def kontak_dosen_pa():
    """Kontak WA Dosen PA dari anak yang dipantau (kepemilikan: hanya anak sendiri)."""
    ortu = _current_user().orang_tua
    if not ortu:
        raise ApiError("TIDAK_DITEMUKAN", "Profil orang tua tidak ditemukan.", 404)
    mhs = db.session.get(Mahasiswa, ortu.nim)
    dosen = mhs.dosen_pa if mhs else None
    return jsonify({
        "nim": ortu.nim,
        "nama_mahasiswa": mhs.nama if mhs else None,
        "dosen_pa": dosen.nama if dosen else None,
        "no_wa_dosen_pa": dosen.no_wa if dosen else None,
    })
