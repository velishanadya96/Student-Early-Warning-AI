"""Skor risiko (FR-04): fitur dari data akademik -> model Random Forest -> kategori + alasan.

Alur hitung():  Nilai/Presensi/Tugas per periode -> 4 fitur -> predict_proba -> kategori (ambang High 0,4)
                -> penjelasan faktor penyebab -> simpan RiskScore -> buat notifikasi bila baru masuk High.
Model dimuat sekali dari MODEL_PATH (file tepercaya di server, bukan unggahan pengguna)."""
import json
import logging
import os
from datetime import date

from flask import current_app

from .errors import ApiError
from .extensions import db
from .models import Mahasiswa, Nilai, Presensi, Tugas, RiskScore

log = logging.getLogger(__name__)

FITUR = ["GPA", "avg_course_grade", "attendance_rate", "assignment_submission_rate"]

# Batas "aman" yang dipakai untuk kalimat alasan. Urutan penjelasan tetap ditentukan oleh dampak ke model.
BATAS = {"attendance_rate": 0.75, "GPA": 2.5, "avg_course_grade": 65.0, "assignment_submission_rate": 0.6}
DAMPAK_MIN = 0.05  # kenaikan peluang High (dibanding nilai tipikal) agar fitur dianggap penyebab

_cache = {}


def hitung_periode(tgl=None):
    """Periode akademik: Agustus-Januari = ganjil '<tahun>-1', Februari-Juli = genap '<tahun>-2'."""
    tgl = tgl or date.today()
    if tgl.month >= 8:
        return f"{tgl.year}-1"
    if tgl.month == 1:
        return f"{tgl.year - 1}-1"
    return f"{tgl.year}-2"


def muat_model():
    path = current_app.config["MODEL_PATH"]
    if path in _cache:
        return _cache[path]
    if not os.path.exists(path):
        raise ApiError("MODEL_TIDAK_ADA", "File model risiko belum tersedia di server (ml/model_final.pkl).", 503)
    import pickle
    import sklearn
    with open(path, "rb") as f:
        art = pickle.load(f)  # nosec: file tepercaya, lokasi diatur server
    if list(art.get("fitur", [])) != FITUR:
        raise ApiError("MODEL_TIDAK_COCOK", "Urutan fitur model tidak sesuai dengan backend.", 503)
    if art.get("versi_sklearn") and art["versi_sklearn"] != sklearn.__version__:
        log.warning("Model dilatih dengan scikit-learn %s tetapi server memakai %s; samakan versi di requirements.txt.",
                    art["versi_sklearn"], sklearn.__version__)
    _cache[path] = art
    return art


def _proba_high(art, baris):
    """baris: list of list (urutan FITUR) -> list peluang kelas High."""
    import pandas as pd
    pipe = art["model"]
    p = pipe.predict_proba(pd.DataFrame(baris, columns=FITUR))
    return p, list(pipe.classes_)


def prediksi(fitur):
    """fitur: dict 4 fitur (boleh None = kosong, diisi median oleh imputer). Return (skor_high, kategori, faktor)."""
    art = muat_model()
    nilai = [fitur.get(k) for k in FITUR]
    proba, kelas = _proba_high(art, [nilai])
    p = proba[0]
    skor = float(p[kelas.index("High")])
    if skor >= art["threshold"]:
        kategori = "High"
    else:
        lain = {k: v for k, v in zip(kelas, p) if k != "High"}
        kategori = max(lain, key=lain.get)
    return skor, kategori, _faktor(art, nilai, skor, kategori)


def _faktor(art, nilai, skor, kategori):
    """Penyebab: bandingkan peluang High sekarang dengan peluang bila SATU fitur diganti nilai tipikal (median).
    Fitur yang paling menurunkan peluang bila 'diperbaiki' = penyebab terbesar."""
    if kategori == "Low":
        return []
    ref = art["referensi"]
    varian = []
    for i, k in enumerate(FITUR):
        v = list(nilai)
        v[i] = ref[k]
        varian.append(v)
    proba, kelas = _proba_high(art, varian)
    ih = kelas.index("High")
    hasil = []
    for i, k in enumerate(FITUR):
        x = nilai[i]
        if x is None:
            continue
        dampak = skor - float(proba[i][ih])
        lebih_buruk = x < ref[k]
        melewati_batas = x < BATAS[k]
        if lebih_buruk and (dampak >= DAMPAK_MIN or melewati_batas):
            hasil.append({"kode": k, "nilai": round(float(x), 4), "dampak": round(dampak, 3),
                          "label": _label(k, x, ref[k]), "singkat": _singkat(k)})
    hasil.sort(key=lambda f: (f["dampak"], f["kode"] == "attendance_rate"), reverse=True)
    if not hasil and kategori == "High":  # tidak ada satu faktor tunggal yang menonjol: ambil yang paling berdampak
        kandidat = [(skor - float(proba[i][ih]), k, nilai[i]) for i, k in enumerate(FITUR) if nilai[i] is not None]
        if kandidat:
            d, k, x = max(kandidat)
            hasil.append({"kode": k, "nilai": round(float(x), 4), "dampak": round(d, 3),
                          "label": _label(k, x, ref[k]), "singkat": _singkat(k)})
    return hasil


def _pct(x):
    return f"{round(x * 100)}%"


def _label(k, x, ref):
    if k == "attendance_rate":
        return f"Kehadiran rendah: {_pct(x)} (batas aman {_pct(BATAS[k])})"
    if k == "GPA":
        return f"IPK rendah: {x:.2f} (batas aman {BATAS[k]:.2f})"
    if k == "avg_course_grade":
        return f"Rata-rata nilai mata kuliah rendah: {x:.0f} (tipikal mahasiswa {ref:.0f})"
    return f"Pengumpulan tugas rendah: {_pct(x)} tugas terkumpul (tipikal {_pct(ref)})"


def _singkat(k):
    return {"attendance_rate": "Kehadiran rendah", "GPA": "IPK rendah",
            "avg_course_grade": "Nilai rata-rata rendah", "assignment_submission_rate": "Tugas kurang terkumpul"}[k]


def kumpulkan_fitur(nim, periode, mhs=None):
    """Hitung 4 fitur satu mahasiswa untuk satu periode dari tabel nilai/presensi/tugas.
    Return (fitur dict, jumlah baris data, catatan list). None = data tidak ada."""
    mhs = mhs or db.session.get(Mahasiswa, nim)
    nilai = [n.nilai_mk for n in Nilai.query.filter_by(nim=nim, semester=periode).all() if n.nilai_mk is not None]
    pres = Presensi.query.filter_by(nim=nim, periode=periode).all()
    tugas = Tugas.query.filter_by(nim=nim, periode=periode).all()
    catatan = []

    avg = sum(nilai) / len(nilai) if nilai else None
    total = sum(p.total_pertemuan for p in pres)
    kehadiran = (sum(p.hadir for p in pres) / total) if total else None
    tugas_rate = (sum(1 for t in tugas if t.waktu_kumpul) / len(tugas)) if tugas else None
    gpa = mhs.ipk if mhs and mhs.ipk is not None else None
    if gpa is None and avg is not None:
        gpa = round(min(avg / 25.0, 4.0), 2)
        catatan.append("IPK tidak ada di data; diperkirakan dari rata-rata nilai.")

    fitur = {"GPA": gpa, "avg_course_grade": avg, "attendance_rate": kehadiran, "assignment_submission_rate": tugas_rate}
    for k, v in fitur.items():
        if v is None:
            catatan.append(f"Data {_NAMA_FITUR[k]} tidak ada; diisi nilai tipikal.")
    return fitur, len(nilai) + len(pres) + len(tugas), catatan


_NAMA_FITUR = {"GPA": "IPK", "avg_course_grade": "nilai mata kuliah", "attendance_rate": "kehadiran",
               "assignment_submission_rate": "tugas"}


def periode_tersedia():
    a = {r[0] for r in db.session.query(Nilai.semester).distinct()}
    a |= {r[0] for r in db.session.query(Presensi.periode).distinct()}
    a |= {r[0] for r in db.session.query(Tugas.periode).distinct()}
    return sorted(a, reverse=True)


def hitung(periode=None, nims=None):
    """Hitung ulang skor semua mahasiswa yang punya data pada periode. Mengembalikan ringkasan.
    Notifikasi dibuat hanya untuk mahasiswa yang BARU masuk kategori High (bukan setiap kali dihitung ulang)."""
    from .notif import buat_notifikasi_high, lengkapi_wa
    periode = periode or (periode_tersedia() or [hitung_periode()])[0]
    kandidat = set()
    kandidat |= {r[0] for r in db.session.query(Nilai.nim).filter_by(semester=periode)}
    kandidat |= {r[0] for r in db.session.query(Presensi.nim).filter_by(periode=periode)}
    kandidat |= {r[0] for r in db.session.query(Tugas.nim).filter_by(periode=periode)}
    if nims is not None:
        kandidat &= set(nims)

    ringkas = {"periode": periode, "dihitung": 0, "Low": 0, "Medium": 0, "High": 0,
               "baru_high": [], "notifikasi_wa": 0, "high_tanpa_ortu": [], "high_tanpa_dosen_pa": []}
    for nim in sorted(kandidat):
        mhs = db.session.get(Mahasiswa, nim)
        if not mhs:
            continue
        fitur, _, catatan = kumpulkan_fitur(nim, periode, mhs)
        skor, kategori, faktor = prediksi(fitur)
        detail = {"fitur": {k: (None if v is None else round(float(v), 4)) for k, v in fitur.items()},
                  "faktor": faktor, "catatan_data": catatan,
                  "ambang_high": muat_model()["threshold"]}
        sebelumnya = RiskScore.query.filter_by(nim=nim, periode=periode).first()
        kategori_lama = sebelumnya.kategori_risiko if sebelumnya else None
        rs = sebelumnya or RiskScore(nim=nim, periode=periode, skor=skor, kategori_risiko=kategori)
        rs.skor = round(skor, 4)
        rs.kategori_risiko = kategori
        rs.faktor_dominan = (", ".join(f["singkat"] for f in faktor))[:100] or None
        rs.detail = json.dumps(detail, ensure_ascii=False)
        db.session.add(rs)
        db.session.flush()
        ringkas["dihitung"] += 1
        ringkas[kategori] += 1
        if kategori == "High":
            if mhs.id_dosen_pa is None:
                ringkas["high_tanpa_dosen_pa"].append(nim)
            if kategori_lama != "High":
                hasil = buat_notifikasi_high(mhs, rs, detail)
                ringkas["baru_high"].append(nim)
                ringkas["notifikasi_wa"] += hasil["wa"]
                if not hasil["wa"]:
                    ringkas["high_tanpa_ortu"].append(nim)
            else:  # masih High: lengkapi WA bila orang tua baru mendaftar / mengisi nomor setelah skor dibuat
                if lengkapi_wa(mhs, rs, detail):
                    ringkas["notifikasi_wa"] += 1
                elif not _punya_wa(rs.id_score):
                    ringkas["high_tanpa_ortu"].append(nim)
    db.session.commit()
    return ringkas


def _punya_wa(id_score):
    from .models import Notifikasi
    return Notifikasi.query.filter_by(id_score=id_score, kanal="wa").first() is not None


def detail_dict(rs):
    try:
        return json.loads(rs.detail) if rs.detail else {}
    except ValueError:
        return {}


def skor_json(rs):
    d = detail_dict(rs)
    return {"id_score": rs.id_score, "nim": rs.nim, "periode": rs.periode, "skor": rs.skor,
            "kategori": rs.kategori_risiko, "faktor_dominan": rs.faktor_dominan,
            "fitur": d.get("fitur", {}), "faktor": d.get("faktor", []), "catatan_data": d.get("catatan_data", [])}
