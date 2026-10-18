from collections import Counter, defaultdict

from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required

from . import dashboard_bp
from .common import skor_terbaru, kontak_ortu, wa_terbaru, urut_risiko, hitung_kategori, periode_valid
from .. import risk
from ..access import current_user, mahasiswa_query
from ..errors import ApiError
from ..extensions import db
from ..models import (Mahasiswa, OrangTua, RiskScore, CatatanTindakLanjut, Notifikasi, User, DosenPA, RosterMahasiswa)
from ..notif import wa_link
from ..security import roles_required


def _periode_param():
    p = request.args.get("periode")
    return periode_valid(p) if p else None


def _baris(m, rs, ortu=None, wa=None):
    d = risk.skor_json(rs) if rs else None
    return {
        "nim": m.nim, "nama": m.nama, "prodi": m.prodi, "angkatan": m.angkatan, "ipk": m.ipk,
        "dosen_pa": m.dosen_pa.nama if m.dosen_pa else None,
        "periode": rs.periode if rs else None,
        "skor": rs.skor if rs else None, "kategori": rs.kategori_risiko if rs else None,
        "faktor_dominan": rs.faktor_dominan if rs else None,
        "faktor": d["faktor"] if d else [], "fitur": d["fitur"] if d else {},
        "id_score": rs.id_score if rs else None,
        "orang_tua": ({"nama": ortu.nama, "no_wa": ortu.no_wa} if ortu else None),
        "wa": ({"id": wa.id_notifikasi, "status": wa.status_kirim, "link": wa_link(wa.no_tujuan, wa.isi_pesan)} if wa else None),
    }


def _daftar(user, periode):
    mhs = mahasiswa_query(user).order_by(Mahasiswa.nim).all()
    nims = [m.nim for m in mhs]
    skor = skor_terbaru(nims, periode)
    ortu = kontak_ortu(nims)
    wa = wa_terbaru([s.id_score for s in skor.values()])
    return urut_risiko([_baris(m, skor.get(m.nim), ortu.get(m.nim), wa.get(skor[m.nim].id_score) if m.nim in skor else None)
                        for m in mhs])


@dashboard_bp.get("/dosen")
@roles_required("dosen")
def dosen():
    user = current_user()
    periode = _periode_param()
    baris = _daftar(user, periode)
    return jsonify({"periode": periode or (max((b["periode"] for b in baris if b["periode"]), default=None)),
                    "ringkasan": hitung_kategori(baris), "mahasiswa": baris,
                    "wa_menunggu": sum(1 for b in baris if b["wa"] and b["wa"]["status"] == "pending"),
                    "periode_tersedia": risk.periode_tersedia()})


@dashboard_bp.get("/kaprodi")
@roles_required("kaprodi", "admin")
def kaprodi():
    user = current_user()
    periode = _periode_param()
    baris = _daftar(user, periode)
    per_angkatan = defaultdict(lambda: {"High": 0, "Medium": 0, "Low": 0, "belum_dihitung": 0})
    for b in baris:
        per_angkatan[b["angkatan"] or 0][b["kategori"] or "belum_dihitung"] += 1
    penyebab = Counter()
    for b in baris:
        if b["kategori"] == "High":
            for f in b["faktor"]:
                penyebab[f["kode"]] += 1
    tren = defaultdict(lambda: {"High": 0, "Medium": 0, "Low": 0})
    for r in RiskScore.query.all():
        tren[r.periode][r.kategori_risiko] += 1
    return jsonify({
        "periode": periode or (max((b["periode"] for b in baris if b["periode"]), default=None)),
        "ringkasan": hitung_kategori(baris),
        "per_angkatan": [{"angkatan": a or None, **v, "total": sum(v.values())} for a, v in sorted(per_angkatan.items())],
        "penyebab_high": [{"kode": k, "jumlah": n, "nama": risk._singkat(k)} for k, n in penyebab.most_common()],
        "tren": [{"periode": p, **v} for p, v in sorted(tren.items())],
        "mahasiswa": baris,
        "mahasiswa_high": [b for b in baris if b["kategori"] == "High"],
        "periode_tersedia": risk.periode_tersedia(),
    })


@dashboard_bp.get("/admin")
@roles_required("admin")
def admin():
    return jsonify({
        "mahasiswa": Mahasiswa.query.count(),
        "mahasiswa_punya_akun": Mahasiswa.query.filter(Mahasiswa.id_user.isnot(None)).count(),
        "mahasiswa_tanpa_dosen_pa": Mahasiswa.query.filter(Mahasiswa.id_dosen_pa.is_(None)).count(),
        "orang_tua": OrangTua.query.count(),
        "orang_tua_tanpa_wa": OrangTua.query.filter((OrangTua.no_wa.is_(None)) | (OrangTua.no_wa == "")).count(),
        "periode_tersedia": risk.periode_tersedia(),
        "skor_tersimpan": RiskScore.query.count(),
        "wa": {s: Notifikasi.query.filter_by(kanal="wa", status_kirim=s).count() for s in ("pending", "terkirim", "gagal")},
        "wa_provider": current_app.config["WA_PROVIDER"],
    })


def _riwayat(nim):
    return [{"periode": r.periode, "skor": r.skor, "kategori": r.kategori_risiko}
            for r in RiskScore.query.filter_by(nim=nim).order_by(RiskScore.periode).all()]


def _dosen_kontak(m):
    d = m.dosen_pa
    return {"nama": d.nama, "no_wa": d.no_wa} if d else None


@dashboard_bp.get("/mahasiswa")
@roles_required("mahasiswa")
def mahasiswa():
    user = current_user()
    m = user.mahasiswa
    if not m:
        raise ApiError("TIDAK_DITEMUKAN", "Profil mahasiswa tidak ditemukan.", 404)
    skor = skor_terbaru([m.nim]).get(m.nim)
    catatan = (CatatanTindakLanjut.query.filter(CatatanTindakLanjut.nim == m.nim, CatatanTindakLanjut.isi_pesan.isnot(None))
               .order_by(CatatanTindakLanjut.tanggal.desc(), CatatanTindakLanjut.id_catatan.desc()).all())
    return jsonify({
        "mahasiswa": {"nim": m.nim, "nama": m.nama, "prodi": m.prodi, "angkatan": m.angkatan, "ipk": m.ipk},
        "terbaru": risk.skor_json(skor) if skor else None,
        "riwayat": _riwayat(m.nim),
        "pesan_dosen": [{"tanggal": c.tanggal.isoformat(), "isi": c.isi_pesan} for c in catatan],
        "dosen_pa": _dosen_kontak(m),
        "notifikasi_belum_dibaca": Notifikasi.query.filter_by(id_user=user.id_user, kanal="sistem", dibaca=False).count(),
    })


@dashboard_bp.get("/ortu")
@roles_required("orangtua")
def ortu():
    user = current_user()
    o = user.orang_tua
    m = db.session.get(Mahasiswa, o.nim) if o else None
    if not m:
        raise ApiError("TIDAK_DITEMUKAN", "Data mahasiswa yang dipantau tidak ditemukan.", 404)
    skor = skor_terbaru([m.nim]).get(m.nim)
    return jsonify({
        "mahasiswa": {"nim": m.nim, "nama": m.nama,  "ipk": m.ipk, "prodi": m.prodi, "angkatan": m.angkatan},
        "terbaru": risk.skor_json(skor) if skor else None,
        "riwayat": _riwayat(m.nim),
        "dosen_pa": _dosen_kontak(m),
        "notifikasi_belum_dibaca": Notifikasi.query.filter_by(id_user=user.id_user, kanal="sistem", dibaca=False).count(),
    })
