from flask import jsonify, current_app
from flask_jwt_extended import jwt_required

from . import notifikasi_bp
from .common import urut_risiko
from ..access import current_user, mahasiswa_query
from ..errors import ApiError
from ..extensions import db
from ..models import Notifikasi, Mahasiswa, OrangTua, RiskScore
from .. import notif
from ..security import roles_required


def _json(n):
    return {"id": n.id_notifikasi, "isi": n.isi_pesan, "kanal": n.kanal, "status": n.status_kirim, "dibaca": n.dibaca,
            "waktu": (n.dibuat_at.isoformat() if n.dibuat_at else None), "periode": n.score.periode if n.score else None}


@notifikasi_bp.get("")
@jwt_required()
def milik_sendiri():
    """Notifikasi dashboard milik user yang login (kanal sistem), terbaru dulu."""
    user = current_user()
    rows = (Notifikasi.query.filter_by(id_user=user.id_user, kanal="sistem")
            .order_by(Notifikasi.dibuat_at.desc(), Notifikasi.id_notifikasi.desc()).limit(100).all())
    return jsonify({"belum_dibaca": sum(1 for n in rows if not n.dibaca), "notifikasi": [_json(n) for n in rows]})


@notifikasi_bp.patch("/<int:nid>/baca")
@jwt_required()
def tandai_baca(nid):
    user = current_user()
    n = Notifikasi.query.filter_by(id_notifikasi=nid, id_user=user.id_user, kanal="sistem").first()
    if not n:
        raise ApiError("TIDAK_DITEMUKAN", "Notifikasi tidak ditemukan.", 404)
    n.dibaca = True
    db.session.commit()
    return jsonify(_json(n))


def _wa_scope(user):
    """Notifikasi WA ke orang tua yang boleh dikelola user: Dosen = bimbingannya; Kaprodi/Admin = semua."""
    q = Notifikasi.query.filter_by(kanal="wa")
    nims = [m.nim for m in mahasiswa_query(user).all()]
    return q.join(RiskScore, RiskScore.id_score == Notifikasi.id_score).filter(RiskScore.nim.in_(nims))


def _wa_json(n):
    mhs = db.session.get(Mahasiswa, n.score.nim)
    ortu = OrangTua.query.filter_by(nim=mhs.nim).first()
    d = _json(n)
    d.update({"nim": mhs.nim, "nama_mahasiswa": mhs.nama, "orang_tua": ortu.nama if ortu else None,
              "no_tujuan": n.no_tujuan, "percobaan": n.percobaan, "link": notif.wa_link(n.no_tujuan, n.isi_pesan),
              "kategori": n.score.kategori_risiko})
    return d


@notifikasi_bp.get("/wa-ortu")
@roles_required("dosen", "kaprodi", "admin")
def wa_ortu():
    """Daftar pesan WhatsApp ke orang tua (beserta alasan risiko). 'link' membuka WhatsApp dengan pesan siap kirim."""
    user = current_user()
    rows = _wa_scope(user).order_by(Notifikasi.dibuat_at.desc(), Notifikasi.id_notifikasi.desc()).limit(200).all()
    return jsonify({"provider": current_app.config["WA_PROVIDER"], "notifikasi": [_wa_json(n) for n in rows]})


def _ambil_wa(user, nid):
    n = _wa_scope(user).filter(Notifikasi.id_notifikasi == nid).first()
    if not n:
        raise ApiError("TIDAK_DITEMUKAN", "Notifikasi WhatsApp tidak ditemukan.", 404)
    return n


@notifikasi_bp.post("/<int:nid>/terkirim")
@roles_required("dosen", "admin")
def tandai_terkirim(nid):
    """Mode manual: Dosen PA sudah menekan 'Kirim WhatsApp' dan mengirim pesan -> tandai terkirim."""
    n = _ambil_wa(current_user(), nid)
    n.status_kirim = "terkirim"
    n.dikirim_at = notif._now()
    db.session.commit()
    return jsonify(_wa_json(n))


@notifikasi_bp.post("/<int:nid>/kirim-ulang")
@roles_required("dosen", "admin")
def kirim_ulang(nid):
    n = _ambil_wa(current_user(), nid)
    if n.status_kirim == "terkirim":
        raise ApiError("SUDAH_TERKIRIM", "Pesan ini sudah ditandai terkirim.", 409)
    n.status_kirim, n.percobaan = "pending", 0
    notif.kirim_otomatis(n)
    db.session.commit()
    return jsonify(_wa_json(n))


@notifikasi_bp.post("/proses")
@roles_required("admin")
def proses():
    """Coba kirim semua WA berstatus pending (untuk provider otomatis)."""
    return jsonify({"terkirim": notif.proses_pending()})
