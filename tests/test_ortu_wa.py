import os
import subprocess
import sys

import pytest

from app import create_app
from app.extensions import db
from app.models import DosenPA, Mahasiswa, OrangTua, User
from app.security import hash_password


@pytest.fixture()
def client():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "RATELIMIT_ENABLED": False,
                      "EMAIL_VERIFICATION_REQUIRED": False})
    with app.app_context():
        db.create_all()
        def mk(username, email, role):
            u = User(username=username, email=email, role=role, password_hash=hash_password("rahasia123"))
            db.session.add(u); db.session.flush(); return u
        admin = mk("admin", "admin@student.uns.ac.id", "admin")
        d = mk("dosen", "dosen@student.uns.ac.id", "dosen")
        dosen = DosenPA(id_user=d.id_user, nidn="0012345601", nama="Dosen PA", no_wa="6281200000001")
        d2 = mk("dosen2", "dosen2@student.uns.ac.id", "dosen")
        dosen2 = DosenPA(id_user=d2.id_user, nidn="0012345602", nama="Dosen Lain", no_wa="6281200000009")
        db.session.add_all([dosen, dosen2]); db.session.flush()
        m = mk("alya", "alya@student.uns.ac.id", "mahasiswa")
        db.session.add(Mahasiswa(nim="2024001", id_user=m.id_user, id_dosen_pa=dosen.id_dosen_pa, nama="Alya"))
        m2 = mk("bagas", "bagas@student.uns.ac.id", "mahasiswa")
        db.session.add(Mahasiswa(nim="2024002", id_user=m2.id_user, id_dosen_pa=dosen2.id_dosen_pa, nama="Bagas"))
        o = mk("ortu-2024001", "ibu.alya@example.com", "orangtua")
        db.session.add(OrangTua(id_user=o.id_user, nim="2024001", nama="Ibu Alya", no_wa="6281200000002"))
        db.session.commit()
        yield app.test_client()


def tok(c, path, body):
    return c.post(path, json=body).get_json()["access_token"]


def auth(t):
    return {"Authorization": f"Bearer {t}"}


def login_ortu(c, **over):
    body = {"nim": "2024001", "email": "alya@student.uns.ac.id", "password": "rahasia123"}
    body.update(over)
    return c.post("/api/v1/auth/login-ortu", json=body)


def test_login_ortu_ok(client):
    r = login_ortu(client)
    assert r.status_code == 200
    b = r.get_json()
    assert b["role"] == "orangtua" and b["user"]["nim"] == "2024001" and b["user"]["no_wa"] == "6281200000002"


@pytest.mark.parametrize("over", [
    {"password": "salahsalah"},
    {"email": "bagas@student.uns.ac.id"},   # email bukan milik NIM tsb
    {"nim": "9999999"},                      # NIM tidak ada
    {"nim": "2024002", "email": "bagas@student.uns.ac.id"},  # mahasiswa tanpa akun ortu
])
def test_login_ortu_gagal_pesan_sama(client, over):
    r = login_ortu(client, **over)
    assert r.status_code == 401 and r.get_json()["code"] == "KREDENSIAL_SALAH"


def test_dosen_lihat_wa_ortu_hanya_bimbingan_sendiri(client):
    t = tok(client, "/api/v1/auth/login", {"username": "dosen", "password": "rahasia123"})
    r = client.get("/api/v1/kontak/ortu", headers=auth(t))
    assert r.status_code == 200
    data = r.get_json()
    assert [x["nim"] for x in data] == ["2024001"]            # Bagas bukan bimbingan dosen ini
    assert data[0]["no_wa_orang_tua"] == "6281200000002"


def test_ortu_lihat_wa_dosen_pa_anak(client):
    t = login_ortu(client).get_json()["access_token"]
    r = client.get("/api/v1/kontak/dosen-pa", headers=auth(t))
    assert r.status_code == 200 and r.get_json()["no_wa_dosen_pa"] == "6281200000001"


def test_kontak_dibatasi_role(client):
    t = tok(client, "/api/v1/auth/login", {"username": "alya", "password": "rahasia123"})  # mahasiswa
    assert client.get("/api/v1/kontak/ortu", headers=auth(t)).status_code == 403
    assert client.get("/api/v1/kontak/dosen-pa", headers=auth(t)).status_code == 403
    t2 = login_ortu(client).get_json()["access_token"]
    assert client.get("/api/v1/kontak/ortu", headers=auth(t2)).status_code == 403


def _admin(client):
    return auth(tok(client, "/api/v1/auth/login", {"username": "admin", "password": "rahasia123"}))


def test_admin_buat_ortu_dengan_no_wa_dinormalisasi(client):
    r = client.post("/api/v1/users", headers=_admin(client), json={
        "role": "orangtua", "name": "Bapak Bagas", "email": "bapak.bagas@example.com",
        "password": "rahasia123", "nim": "2024002", "no_wa": "0812-3456-7777"})
    assert r.status_code == 201
    b = r.get_json()
    assert b["no_wa"] == "6281234567777" and b["username"] == "ortu-2024002"


def test_ortu_dan_dosen_wajib_no_wa(client):
    base = {"name": "Bapak Bagas", "email": "bapak@example.com", "password": "rahasia123"}
    r = client.post("/api/v1/users", headers=_admin(client), json={**base, "role": "orangtua", "nim": "2024002"})
    assert r.status_code == 422
    r = client.post("/api/v1/users", headers=_admin(client),
                    json={**base, "email": "d3@student.uns.ac.id", "role": "dosen", "nidn": "0099999901"})
    assert r.status_code == 422


def test_no_wa_tidak_valid(client):
    r = client.post("/api/v1/users", headers=_admin(client), json={
        "role": "orangtua", "name": "Bapak Bagas", "email": "b@example.com",
        "password": "rahasia123", "nim": "2024002", "no_wa": "abc"})
    assert r.status_code == 422


def test_admin_ubah_no_wa(client):
    uid = User.query.filter_by(username="ortu-2024001").first().id_user
    r = client.put(f"/api/v1/users/{uid}", headers=_admin(client), json={"no_wa": "+62 812 999 0000"})
    assert r.status_code == 200 and r.get_json()["no_wa"] == "628129990000"


def test_migrasi_satu_head():
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    base = os.path.dirname(os.path.dirname(__file__))
    cfg = Config(os.path.join(base, "migrations", "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(base, "migrations"))
    assert len(ScriptDirectory.from_config(cfg).get_heads()) == 1


def _reg_ortu(c, **over):
    body = {"name": "Bapak Bagas", "email": "bapak.bagas@example.com", "password": "rahasia123",
            "nim": "2024002", "email_mahasiswa": "bagas@student.uns.ac.id", "no_wa": "0813 1111 2222"}
    body.update(over)
    return c.post("/api/v1/auth/register-ortu", json=body)


def test_register_ortu_lalu_login_dan_wa_tersimpan(client):
    r = _reg_ortu(client)
    assert r.status_code == 201 and r.get_json()["no_wa"] == "6281311112222"
    row = OrangTua.query.filter_by(nim="2024002").first()
    assert row.no_wa == "6281311112222" and row.user.password_hash.startswith("$2")
    assert client.post("/api/v1/auth/login-ortu", json={
        "nim": "2024002", "email": "bagas@student.uns.ac.id", "password": "rahasia123"}).status_code == 200


def test_register_ortu_verifikasi_gagal(client):
    assert _reg_ortu(client, email_mahasiswa="alya@student.uns.ac.id").status_code == 422  # email bukan milik NIM
    assert _reg_ortu(client, nim="9999999").status_code == 422


def test_register_ortu_ganda_ditolak(client):
    assert _reg_ortu(client, nim="2024001", email_mahasiswa="alya@student.uns.ac.id",
                     email="lain@example.com").status_code == 409


def test_register_ortu_wajib_wa(client):
    assert _reg_ortu(client, no_wa="").status_code == 422
