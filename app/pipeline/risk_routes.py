from flask import request, jsonify

from . import risk_bp
from .common import periode_valid
from .. import risk
from ..access import current_user, ambil_mahasiswa
from ..models import RiskScore, CatatanTindakLanjut
from ..security import roles_required
from flask_jwt_extended import jwt_required


@risk_bp.post("/hitung")
@roles_required("admin")
def hitung():
    """Hitung ulang skor risiko satu periode (FR-04). Body opsional: {"periode": "2026-1"}; default = periode data terbaru."""
    body = request.get_json(silent=True) or {}
    periode = periode_valid(body["periode"]) if body.get("periode") else None
    return jsonify(risk.hitung(periode))


@risk_bp.get("/periode")
@jwt_required()
def periode():
    return jsonify({"periode": risk.periode_tersedia(), "periode_sekarang": risk.hitung_periode()})


@risk_bp.get("/<nim>")
@jwt_required()
def detail(nim):
    """Skor terbaru + riwayat + faktor penyebab satu mahasiswa (hanya yang boleh dilihat peran ini)."""
    user = current_user()
    m = ambil_mahasiswa(user, nim)
    semua = RiskScore.query.filter_by(nim=nim).order_by(RiskScore.periode).all()
    terbaru = risk.skor_json(semua[-1]) if semua else None
    return jsonify({
        "mahasiswa": {"nim": m.nim, "nama": m.nama, "prodi": m.prodi, "angkatan": m.angkatan, "ipk": m.ipk},
        "terbaru": terbaru,
        "riwayat": [{"periode": r.periode, "skor": r.skor, "kategori": r.kategori_risiko} for r in semua],
    })
