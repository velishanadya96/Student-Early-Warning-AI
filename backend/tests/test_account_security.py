import re
from datetime import datetime, timedelta, timezone

from app import mailer
from app.extensions import db
from app.models import RevokedToken, User
from tests.conftest import PASSWORD, make_app

NEW = {"name": "Tata Meirzha", "email": "tata@student.uns.ac.id", "password": PASSWORD, "nim": "2024006"}


def token_from_outbox(path):
    return re.search(rf"{path}\?token=(\S+)", mailer.outbox[-1]["text"]).group(1)


def clear_outbox():
    mailer.outbox.clear()


# ---------- logout / token dicabut ----------
def test_logout_mencabut_refresh_dan_access_token(client, login):
    body = login("alya").get_json()
    access, refresh = body["access_token"], body["refresh_token"]
    for token in (access, refresh):
        assert client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access}"}).status_code == 401
    assert client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {refresh}"}).status_code == 401


def test_logout_tanpa_token_401(client):
    assert client.post("/api/v1/auth/logout").status_code == 401


def test_logout_membersihkan_token_kedaluwarsa(client, login):
    db.session.add(RevokedToken(jti="lama", expires_at=datetime.now(timezone.utc) - timedelta(days=1)))
    db.session.commit()
    access = login("alya").get_json()["access_token"]
    client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {access}"})
    assert RevokedToken.query.filter_by(jti="lama").first() is None


# ---------- penguncian akun ----------
def test_akun_terkunci_setelah_lima_kali_salah_password(login):
    assert [login("alya", "salahsalah").status_code for _ in range(5)] == [401] * 5
    locked = login("alya", PASSWORD)  # password benar pun ditolak saat terkunci
    assert locked.status_code == 423 and locked.get_json()["code"] == "AKUN_TERKUNCI"


def test_hitungan_direset_saat_berhasil_dan_kunci_berakhir(login):
    for _ in range(3):
        login("alya", "salahsalah")
    assert login("alya", PASSWORD).status_code == 200
    assert User.query.filter_by(username="alya").first().failed_logins == 0
    for _ in range(5):
        login("alya", "salahsalah")
    user = User.query.filter_by(username="alya").first()
    user.locked_until = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.session.commit()
    assert login("alya", PASSWORD).status_code == 200


# ---------- verifikasi email ----------
def test_register_mengirim_email_dan_login_ditolak_sebelum_verifikasi():
    app = make_app()
    client = app.test_client()
    with app.app_context():
        clear_outbox()
        res = client.post("/api/v1/auth/register", json=NEW)
        assert res.status_code == 201 and res.get_json()["verification_required"] is True
        assert mailer.outbox[-1]["to"] == NEW["email"]

        blocked = client.post("/api/v1/auth/login", json={"username": NEW["email"], "password": PASSWORD})
        assert blocked.status_code == 403 and blocked.get_json()["code"] == "EMAIL_BELUM_TERVERIFIKASI"

        assert client.post("/api/v1/auth/verify-email", json={"token": token_from_outbox("verify-email")}).status_code == 200
        assert client.post("/api/v1/auth/login", json={"username": NEW["email"], "password": PASSWORD}).status_code == 200


def test_salah_password_tidak_membocorkan_status_verifikasi():
    app = make_app()
    client = app.test_client()
    with app.app_context():
        client.post("/api/v1/auth/register", json=NEW)
        res = client.post("/api/v1/auth/login", json={"username": NEW["email"], "password": "salahsalah"})
        assert res.status_code == 401 and res.get_json()["code"] == "KREDENSIAL_SALAH"


def test_verifikasi_dimatikan_lewat_config():
    app = make_app(REQUIRE_EMAIL_VERIFICATION=False)
    client = app.test_client()
    with app.app_context():
        client.post("/api/v1/auth/register", json=NEW)
        assert client.post("/api/v1/auth/login", json={"username": NEW["email"], "password": PASSWORD}).status_code == 200


def test_token_verifikasi_rusak_ditolak(client):
    res = client.post("/api/v1/auth/verify-email", json={"token": "bukan-token"})
    assert res.status_code == 400 and res.get_json()["code"] == "TOKEN_TIDAK_VALID"


def test_token_verifikasi_kedaluwarsa_ditolak(app, client):
    client.post("/api/v1/auth/register", json=NEW)
    token = token_from_outbox("verify-email")
    app.config["VERIFY_TOKEN_HOURS"] = -1
    res = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert res.status_code == 400 and res.get_json()["code"] == "TOKEN_KEDALUWARSA"


def test_kirim_ulang_verifikasi_jawabannya_sama_untuk_email_ada_atau_tidak(client):
    client.post("/api/v1/auth/register", json=NEW)
    clear_outbox()
    ada = client.post("/api/v1/auth/resend-verification", json={"email": NEW["email"]})
    assert len(mailer.outbox) == 1
    tidak_ada = client.post("/api/v1/auth/resend-verification", json={"email": "tidak.ada@student.uns.ac.id"})
    assert len(mailer.outbox) == 1
    assert ada.get_json() == tidak_ada.get_json()


def test_akun_buatan_admin_langsung_terverifikasi(client, auth):
    res = client.post("/api/v1/users", json={"role": "kaprodi", "name": "Kaprodi Baru", "email": "kp@student.uns.ac.id", "password": PASSWORD}, headers=auth("admin"))
    assert res.get_json()["email_verified"] is True
    assert client.post("/api/v1/auth/login", json={"username": "kp@student.uns.ac.id", "password": PASSWORD}).status_code == 200


# ---------- reset password ----------
def test_alur_lupa_dan_reset_password(client, login):
    clear_outbox()
    assert client.post("/api/v1/auth/forgot-password", json={"email": "alya@student.uns.ac.id"}).status_code == 200
    baru = "PasswordBaru123"
    assert client.post("/api/v1/auth/reset-password", json={"token": token_from_outbox("reset-password"), "password": baru}).status_code == 200
    assert login("alya", PASSWORD).status_code == 401
    assert login("alya", baru).status_code == 200


def test_token_reset_hanya_sekali_pakai(client):
    clear_outbox()
    client.post("/api/v1/auth/forgot-password", json={"email": "alya@student.uns.ac.id"})
    token = token_from_outbox("reset-password")
    assert client.post("/api/v1/auth/reset-password", json={"token": token, "password": "PasswordBaru123"}).status_code == 200
    assert client.post("/api/v1/auth/reset-password", json={"token": token, "password": "LainLagi12345"}).status_code == 400


def test_lupa_password_jawabannya_sama_untuk_email_ada_atau_tidak(client):
    clear_outbox()
    ada = client.post("/api/v1/auth/forgot-password", json={"email": "alya@student.uns.ac.id"})
    tidak_ada = client.post("/api/v1/auth/forgot-password", json={"email": "tidak.ada@student.uns.ac.id"})
    assert ada.get_json() == tidak_ada.get_json()
    assert len(mailer.outbox) == 1


def test_reset_password_membuka_kunci_dan_memverifikasi_email():
    app = make_app()
    client = app.test_client()
    with app.app_context():
        client.post("/api/v1/auth/register", json=NEW)
        clear_outbox()
        client.post("/api/v1/auth/forgot-password", json={"email": NEW["email"]})
        token = token_from_outbox("reset-password")
        assert client.post("/api/v1/auth/reset-password", json={"token": token, "password": "PasswordBaru123"}).status_code == 200
        assert client.post("/api/v1/auth/login", json={"username": NEW["email"], "password": "PasswordBaru123"}).status_code == 200


def test_reset_password_menolak_password_pendek(client):
    clear_outbox()
    client.post("/api/v1/auth/forgot-password", json={"email": "alya@student.uns.ac.id"})
    res = client.post("/api/v1/auth/reset-password", json={"token": token_from_outbox("reset-password"), "password": "pendek"})
    assert res.status_code == 422


def test_akun_nonaktif_tidak_menerima_email_reset(client, auth, login):
    uid = login("alya").get_json()["user"]["id"]
    client.delete(f"/api/v1/users/{uid}", headers=auth("admin"))
    clear_outbox()
    client.post("/api/v1/auth/forgot-password", json={"email": "alya@student.uns.ac.id"})
    assert mailer.outbox == []
