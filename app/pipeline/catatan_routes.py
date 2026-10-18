from datetime import date

from flask import request, jsonify
from flask_jwt_extended import jwt_required
from pydantic import BaseModel, field_validator
from typing import Optional

from . import catatan_bp
from .. import risk
from ..access import current_user, ambil_mahasiswa
from ..errors import ApiError
from ..extensions import db
from ..models import CatatanTindakLanjut, RiskScore, Notifikasi
from ..notif import _now
from ..schemas import parse
from ..security import roles_required


class CatatanIn(BaseModel):
    nim: str
    isi_catatan: str
    isi_pesan: Optional[str] = None

    @field_validator("isi_catatan")
    @classmethod
    def _isi(cls, v):
        v = v.strip()
        if not 3 <= len(v) <= 2000:
            raise ValueError("Catatan 3-2000 karakter.")
        return v

    @field_validator("isi_pesan")
    @classmethod
    def _pesan(cls, v):
        v = (v or "").strip() or None
        if v and len(v) > 1000:
            raise ValueError("Pesan untuk mahasiswa maksimal 1000 karakter.")
        return v


def _json(c):
    return {"id": c.id_catatan, "nim": c.nim, "tanggal": c.tanggal.isoformat(), "isi_catatan": c.isi_catatan,
            "isi_pesan": c.isi_pesan, "dosen": c.dosen.nama if c.dosen else None, "periode": c.score.periode if c.score else None}


@catatan_bp.post("")
@roles_required("dosen")
def tambah():
    """Dosen PA menulis catatan tindak lanjut untuk mahasiswa bimbingannya (FR-07). Isi 'isi_pesan' untuk
    sekaligus mengirim pesan ke dashboard mahasiswa."""
    user = current_user()
    body = parse(CatatanIn, request.get_json(silent=True))
    m = ambil_mahasiswa(user, body.nim)
    skor = RiskScore.query.filter_by(nim=m.nim).order_by(RiskScore.periode.desc()).first()
    if not skor:
        raise ApiError("BELUM_ADA_SKOR", "Mahasiswa ini belum punya skor risiko; hitung skor dulu.", 409)
    c = CatatanTindakLanjut(nim=m.nim, id_dosen_pa=user.dosen_pa.id_dosen_pa, id_score=skor.id_score,
                            isi_catatan=body.isi_catatan, isi_pesan=body.isi_pesan, tanggal=date.today())
    db.session.add(c)
    if body.isi_pesan and m.user:
        db.session.add(Notifikasi(id_user=m.user.id_user, id_score=skor.id_score, kanal="sistem", status_kirim="terkirim",
                                  isi_pesan=f"Pesan dari Dosen PA: {body.isi_pesan}", dibuat_at=_now(), dikirim_at=_now()))
    db.session.commit()
    return jsonify(_json(c)), 201


@catatan_bp.get("")
@jwt_required()
def daftar():
    """?nim=  Dosen/Kaprodi/Admin: seluruh catatan mahasiswa itu. Mahasiswa: hanya pesan yang ditujukan kepadanya."""
    user = current_user()
    if user.role == "orangtua":
        raise ApiError("AKSES_DITOLAK", "Anda tidak memiliki akses ke fitur ini.", 403)
    nim = request.args.get("nim") or user.nim
    if not nim:
        raise ApiError("VALIDASI_GAGAL", "Parameter 'nim' wajib diisi.", 422)
    m = ambil_mahasiswa(user, nim)
    q = CatatanTindakLanjut.query.filter_by(nim=m.nim)
    if user.role == "mahasiswa":
        q = q.filter(CatatanTindakLanjut.isi_pesan.isnot(None))
    hasil = q.order_by(CatatanTindakLanjut.tanggal.desc(), CatatanTindakLanjut.id_catatan.desc()).all()
    out = [_json(c) for c in hasil]
    if user.role == "mahasiswa":
        for o in out:
            o["isi_catatan"] = None  # catatan internal Dosen PA tidak ditampilkan ke mahasiswa
    return jsonify(out)
