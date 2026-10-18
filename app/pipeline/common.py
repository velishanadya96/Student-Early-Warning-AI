import re

from sqlalchemy import func

from ..errors import ApiError
from ..extensions import db
from ..models import RiskScore, OrangTua, Notifikasi

PERIODE_RE = re.compile(r"^(20\d{2})-([12])$")


def periode_valid(p):
    p = (p or "").strip()
    if not PERIODE_RE.match(p):
        raise ApiError("VALIDASI_GAGAL", "Periode harus berformat TAHUN-1 (ganjil) atau TAHUN-2 (genap), mis. 2026-1.", 422)
    return p


def skor_terbaru(nims, periode=None):
    """{nim: RiskScore} - skor pada periode tertentu, atau periode terbaru milik masing-masing mahasiswa."""
    nims = list(nims)
    if not nims:
        return {}
    q = RiskScore.query.filter(RiskScore.nim.in_(nims))
    if periode:
        q = q.filter(RiskScore.periode == periode)
    hasil = {}
    for rs in q.order_by(RiskScore.periode).all():
        hasil[rs.nim] = rs  # urut naik -> yang terakhir = periode terbaru
    return hasil


def kontak_ortu(nims):
    return {o.nim: o for o in OrangTua.query.filter(OrangTua.nim.in_(list(nims))).all()} if nims else {}


def wa_terbaru(id_scores):
    """{id_score: Notifikasi wa}"""
    if not id_scores:
        return {}
    return {n.id_score: n for n in Notifikasi.query.filter(Notifikasi.kanal == "wa", Notifikasi.id_score.in_(list(id_scores))).all()}


def urut_risiko(baris):
    pri = {"High": 0, "Medium": 1, "Low": 2, None: 3}
    return sorted(baris, key=lambda b: (pri.get(b.get("kategori"), 3), -(b.get("skor") or 0), b["nim"]))


def hitung_kategori(baris):
    c = {"High": 0, "Medium": 0, "Low": 0, "belum_dihitung": 0}
    for b in baris:
        c[b["kategori"] if b.get("kategori") else "belum_dihitung"] += 1
    c["total"] = len(baris)
    return c
