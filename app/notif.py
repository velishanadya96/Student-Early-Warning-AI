"""Notifikasi risiko tinggi (FR-11).

Saat mahasiswa BARU masuk kategori High dibuat:
  - notifikasi 'sistem' (tampil di dashboard) untuk mahasiswa, Dosen PA, dan orang tua;
  - 1 notifikasi 'wa' untuk orang tua: pesan WhatsApp berisi ALASAN risiko tinggi (kehadiran / IPK / nilai / tugas).
Pengiriman WA lewat WA_PROVIDER: manual (Dosen PA menekan tombol kirim), fonnte (otomatis), log (uji coba)."""
import logging
from datetime import datetime, timezone
from urllib.parse import quote

import requests
from flask import current_app

from .extensions import db
from .models import Notifikasi, OrangTua, User

log = logging.getLogger(__name__)


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def alasan_teks(detail):
    faktor = detail.get("faktor") or []
    if not faktor:
        return "Kombinasi indikator akademik berada di bawah batas aman."
    return "\n".join(f"{i}. {f['label']}" for i, f in enumerate(faktor, 1))


def pesan_wa_ortu(mhs, rs, detail, ortu=None):
    dosen = mhs.dosen_pa
    bagian = [
        "[Student Early Warning]",
        f"Yth. Bapak/Ibu {ortu.nama if ortu else 'Orang Tua/Wali'},",
        f"Berdasarkan data akademik periode {rs.periode}, ananda {mhs.nama} (NIM {mhs.nim}) "
        f"berada pada kategori RISIKO TINGGI.",
        f"Penyebab utama:\n{alasan_teks(detail)}",
    ]
    if dosen:
        bagian.append(f"Silakan hubungi Dosen PA ananda, {dosen.nama}" + (f" (WhatsApp +{dosen.no_wa})" if dosen.no_wa else "") + ".")
    bagian.append("Mohon dukungan Bapak/Ibu untuk berkomunikasi dengan ananda. Pesan ini dibuat otomatis oleh sistem peringatan dini.")
    return "\n\n".join(bagian)


def pesan_sistem(mhs, rs, detail, untuk):
    ringkas = rs.faktor_dominan or "indikator akademik di bawah batas aman"
    if untuk == "mahasiswa":
        return f"Risiko akademikmu periode {rs.periode} masuk kategori TINGGI. Penyebab: {ringkas}. Segera temui Dosen PA-mu."
    if untuk == "orangtua":
        return f"Ananda {mhs.nama} berada pada kategori risiko TINGGI periode {rs.periode}. Penyebab: {ringkas}."
    return f"{mhs.nama} ({mhs.nim}) masuk kategori risiko TINGGI periode {rs.periode}. Penyebab: {ringkas}."


def wa_link(no, teks):
    return f"https://wa.me/{no}?text={quote(teks)}" if no else None


def _tambah(id_user, rs, isi, kanal, status, no=None):
    n = Notifikasi(id_user=id_user, id_score=rs.id_score, isi_pesan=isi, kanal=kanal, status_kirim=status,
                   no_tujuan=no, dibuat_at=_now(), dikirim_at=_now() if (kanal == "sistem") else None)
    db.session.add(n)
    return n


def lengkapi_wa(mhs, rs, detail):
    """Buat notifikasi WA ke orang tua bila belum ada untuk skor ini dan orang tua punya nomor. True bila dibuat."""
    ortu = OrangTua.query.filter_by(nim=mhs.nim).first()
    if not ortu or not ortu.no_wa:
        return False
    if Notifikasi.query.filter_by(id_score=rs.id_score, kanal="wa").first():
        return False
    n = _tambah(ortu.id_user, rs, pesan_wa_ortu(mhs, rs, detail, ortu), "wa", "pending", ortu.no_wa)
    db.session.flush()
    kirim_otomatis(n)
    return True


def buat_notifikasi_high(mhs, rs, detail):
    """Dipanggil sekali saat mahasiswa baru masuk High. Return {'wa': 0|1}."""
    if mhs.user:
        _tambah(mhs.user.id_user, rs, pesan_sistem(mhs, rs, detail, "mahasiswa"), "sistem", "terkirim")
    if mhs.dosen_pa:
        _tambah(mhs.dosen_pa.id_user, rs, pesan_sistem(mhs, rs, detail, "dosen"), "sistem", "terkirim")
    ortu = OrangTua.query.filter_by(nim=mhs.nim).first()
    if ortu:
        _tambah(ortu.id_user, rs, pesan_sistem(mhs, rs, detail, "orangtua"), "sistem", "terkirim")
    db.session.flush()
    return {"wa": 1 if lengkapi_wa(mhs, rs, detail) else 0}


# ---------------------------------------------------------------- pengiriman WhatsApp

def _kirim_fonnte(no, teks):
    token = current_app.config.get("FONNTE_TOKEN")
    if not token:
        raise RuntimeError("FONNTE_TOKEN belum diisi")
    r = requests.post("https://api.fonnte.com/send", headers={"Authorization": token},
                      data={"target": no, "message": teks, "countryCode": "62"}, timeout=15)
    r.raise_for_status()
    body = r.json()
    if not body.get("status"):
        raise RuntimeError(f"Fonnte menolak: {body.get('reason', body)}")


def kirim_otomatis(n):
    """Coba kirim satu notifikasi WA sesuai WA_PROVIDER. manual -> dibiarkan pending (ditandai oleh Dosen PA)."""
    provider = current_app.config.get("WA_PROVIDER", "manual")
    if n.kanal != "wa" or n.status_kirim != "pending" or provider == "manual":
        return n.status_kirim
    n.percobaan = (n.percobaan or 0) + 1
    try:
        if provider == "fonnte":
            _kirim_fonnte(n.no_tujuan, n.isi_pesan)
        elif provider == "log":
            log.info("[WA log] ke %s:\n%s", n.no_tujuan, n.isi_pesan)
        else:
            raise RuntimeError(f"WA_PROVIDER tidak dikenal: {provider}")
        n.status_kirim = "terkirim"
        n.dikirim_at = _now()
    except Exception as exc:  # jaringan / token / nomor salah -> coba lagi sampai WA_MAX_RETRY
        log.warning("Kirim WA notif %s gagal (percobaan %s): %s", n.id_notifikasi, n.percobaan, exc)
        if n.percobaan >= current_app.config["WA_MAX_RETRY"]:
            n.status_kirim = "gagal"
    return n.status_kirim


def proses_pending(batas=100):
    """Dipakai worker.py dan endpoint admin: coba kirim semua WA berstatus pending. Return jumlah terkirim."""
    n_ok = 0
    for n in Notifikasi.query.filter_by(kanal="wa", status_kirim="pending").limit(batas).all():
        if kirim_otomatis(n) == "terkirim":
            n_ok += 1
    db.session.commit()
    return n_ok
