"""Kepemilikan data (Bagian 9): siapa boleh melihat mahasiswa mana."""
from flask_jwt_extended import get_jwt_identity

from .errors import ApiError
from .extensions import db
from .models import Mahasiswa, User


def current_user():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not user.is_active:
        raise ApiError("AKUN_NONAKTIF", "Akun tidak aktif. Silakan login ulang.", 401)
    return user


def mahasiswa_query(user):
    """Query Mahasiswa yang boleh dilihat user. Admin/Kaprodi: semua; Dosen: bimbingannya; Mahasiswa/Ortu: satu orang."""
    q = Mahasiswa.query
    if user.role in ("admin", "kaprodi"):
        return q
    if user.role == "dosen":
        if not user.dosen_pa:
            return q.filter(db.false())
        return q.filter(Mahasiswa.id_dosen_pa == user.dosen_pa.id_dosen_pa)
    return q.filter(Mahasiswa.nim == (user.nim or ""))


def ambil_mahasiswa(user, nim):
    """Mahasiswa bila boleh dilihat; kalau tidak -> 404 (tidak membocorkan keberadaan NIM)."""
    m = mahasiswa_query(user).filter(Mahasiswa.nim == nim).first()
    if not m:
        raise ApiError("TIDAK_DITEMUKAN", "Data mahasiswa tidak ditemukan.", 404)
    return m
