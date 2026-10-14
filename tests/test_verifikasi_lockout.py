from datetime import datetime, timedelta, timezone

import pytest

from app import create_app
from app.extensions import db
from app.mailer import OUTBOX
from app.models import Mahasiswa, User
from app.security import hash_password


@pytest.fixture()
def app():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "RATELIMIT_ENABLED": False,
                      "EMAIL_VERIFICATION_REQUIRED": True, "MAX_FAILED_LOGINS": 3, "LOCKOUT_MINUTES": 15})
    with app.app_context():
        db.create_all()
        u = User(username="alya", email="alya@student.uns.ac.id", role="mahasiswa", password_hash=hash_password("rahasia123"))
        db.session.add(u); db.session.flush()
        db.session.add(Mahasiswa(nim="2024001", id_user=u.id_user, nama="Alya"))
        db.session.commit()
        OUTBOX.clear()
        yield app


@pytest.fixture()
def c(app):
    return app.test_client()


REG = {"name": "Budi Santoso", "email": "budi@student.uns.ac.id", "password": "rahasia123", "nim": "2024099"}


def token_dari_email():
    return OUTBOX[-1]["link"].split("token=")[1]


def test_register_mengirim_email_dan_belum_bisa_login(c):
    r = c.post("/api/v1/auth/register", json=REG)
    assert r.status_code == 201
    assert r.get_json()["verification_required"] is True and r.get_json()["email_verified"] is False
    assert len(OUTBOX) == 1 and OUTBOX[0]["to"] == REG["email"]
    r = c.post("/api/v1/auth/login", json={"username": REG["email"], "password": REG["password"]})
    assert r.status_code == 403 and r.get_json()["code"] == "EMAIL_BELUM_TERVERIFIKASI"


def test_verifikasi_lalu_login_berhasil(c):
    c.post("/api/v1/auth/register", json=REG)
    r = c.post("/api/v1/auth/verify-email", json={"token": token_dari_email()})
    assert r.status_code == 200
    r = c.post("/api/v1/auth/login", json={"username": REG["email"], "password": REG["password"]})
    assert r.status_code == 200 and r.get_json()["user"]["email_verified"] is True


def test_token_sekali_pakai_dan_palsu_ditolak(c):
    c.post("/api/v1/auth/register", json=REG)
    t = token_dari_email()
    assert c.post("/api/v1/auth/verify-email", json={"token": t}).status_code == 200
    assert c.post("/api/v1/auth/verify-email", json={"token": t}).status_code == 400
    assert c.post("/api/v1/auth/verify-email", json={"token": "ngasal"}).status_code == 400


def test_token_kedaluwarsa(app, c):
    c.post("/api/v1/auth/register", json=REG)
    with app.app_context():
        u = User.query.filter_by(email=REG["email"]).first()
        u.verify_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.session.commit()
    r = c.post("/api/v1/auth/verify-email", json={"token": token_dari_email()})
    assert r.status_code == 400 and r.get_json()["code"] == "TOKEN_VERIFIKASI_KEDALUWARSA"


def test_kirim_ulang_membatalkan_token_lama(c):
    c.post("/api/v1/auth/register", json=REG)
    lama = token_dari_email()
    r = c.post("/api/v1/auth/resend-verification", json={"email": REG["email"]})
    assert r.status_code == 200 and len(OUTBOX) == 2
    assert c.post("/api/v1/auth/verify-email", json={"token": lama}).status_code == 400
    assert c.post("/api/v1/auth/verify-email", json={"token": token_dari_email()}).status_code == 200


def test_kirim_ulang_tidak_membocorkan_email(c):
    r1 = c.post("/api/v1/auth/resend-verification", json={"email": "tidak-ada@student.uns.ac.id"})
    r2 = c.post("/api/v1/auth/resend-verification", json={"email": "alya@student.uns.ac.id"})  # sudah terverifikasi
    assert r1.status_code == r2.status_code == 200 and r1.get_json() == r2.get_json()
    assert OUTBOX == []


def test_lockout_setelah_gagal_berulang(c):
    bad = {"username": "alya@student.uns.ac.id", "password": "salahsalah"}
    for _ in range(3):
        assert c.post("/api/v1/auth/login", json=bad).status_code == 401
    r = c.post("/api/v1/auth/login", json=bad)
    assert r.status_code == 423 and r.get_json()["code"] == "AKUN_TERKUNCI"
    # password benar pun ditolak selama dikunci
    r = c.post("/api/v1/auth/login", json={"username": "alya@student.uns.ac.id", "password": "rahasia123"})
    assert r.status_code == 423


def test_lockout_selesai_dan_counter_direset(app, c):
    bad = {"username": "alya@student.uns.ac.id", "password": "salahsalah"}
    for _ in range(3):
        c.post("/api/v1/auth/login", json=bad)
    with app.app_context():
        u = User.query.filter_by(username="alya").first()
        u.locked_until = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.session.commit()
    ok = {"username": "alya@student.uns.ac.id", "password": "rahasia123"}
    assert c.post("/api/v1/auth/login", json=ok).status_code == 200
    with app.app_context():
        assert User.query.filter_by(username="alya").first().failed_logins == 0


def test_gagal_sesekali_tidak_mengunci(c):
    bad = {"username": "alya@student.uns.ac.id", "password": "salahsalah"}
    ok = {"username": "alya@student.uns.ac.id", "password": "rahasia123"}
    for _ in range(2):
        c.post("/api/v1/auth/login", json=bad)
    assert c.post("/api/v1/auth/login", json=ok).status_code == 200
    for _ in range(2):
        c.post("/api/v1/auth/login", json=bad)
    assert c.post("/api/v1/auth/login", json=ok).status_code == 200


def test_ortu_register_perlu_verifikasi(c):
    r = c.post("/api/v1/auth/register-ortu", json={
        "name": "Ibu Alya", "email": "ibu@example.com", "password": "rahasia123",
        "nim": "2024001", "email_mahasiswa": "alya@student.uns.ac.id", "no_wa": "081234567890"})
    assert r.status_code == 201 and r.get_json()["verification_required"] is True
    body = {"nim": "2024001", "email": "alya@student.uns.ac.id", "password": "rahasia123"}
    assert c.post("/api/v1/auth/login-ortu", json=body).status_code == 403
    assert c.post("/api/v1/auth/verify-email", json={"token": token_dari_email()}).status_code == 200
    assert c.post("/api/v1/auth/login-ortu", json=body).status_code == 200


def test_me_butuh_token_dan_mengembalikan_role_dari_server(c):
    assert c.get("/api/v1/auth/me").status_code == 401
    tok = c.post("/api/v1/auth/login", json={"username": "alya@student.uns.ac.id", "password": "rahasia123"}).get_json()["access_token"]
    r = c.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200 and r.get_json()["role"] == "mahasiswa" and r.get_json()["email"] == "alya@student.uns.ac.id"


def test_me_menolak_akun_nonaktif(app, c):
    tok = c.post("/api/v1/auth/login", json={"username": "alya@student.uns.ac.id", "password": "rahasia123"}).get_json()["access_token"]
    u = User.query.filter_by(username="alya").first()
    u.is_active = False
    db.session.commit()
    db.session.expire_all()
    assert c.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 401
