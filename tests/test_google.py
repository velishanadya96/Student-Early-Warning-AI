import pytest

from app import create_app
from app.errors import ApiError
from app.extensions import db
from app.models import Mahasiswa, User
from app.security import hash_password

# Token palsu -> identitas Google yang "sudah diverifikasi Google". Verifikasi tanda tangan sungguhan
# (library google-auth) tidak bisa dites offline, jadi fungsi verifikasinya diganti.
FAKE = {
    "tok-budi": {"email": "budi@gmail.com", "name": "Budi Santoso", "sub": "1"},
    "tok-alya": {"email": "alya@student.uns.ac.id", "name": "Alya Putri", "sub": "2"},
    "tok-nobody": {"email": "nobody@gmail.com", "name": "Nobody", "sub": "3"},
    "tok-admin": {"email": "admin@student.uns.ac.id", "name": "Admin", "sub": "4"},
}


def fake_verify(credential):
    if credential not in FAKE:
        raise ApiError("GOOGLE_TOKEN_TIDAK_VALID", "Login Google gagal atau sudah kedaluwarsa. Coba lagi.", 401)
    return FAKE[credential]


@pytest.fixture()
def app(monkeypatch):
    monkeypatch.setattr("app.auth.routes.verify_google_credential", fake_verify)
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "RATELIMIT_ENABLED": False,
                      "GOOGLE_CLIENT_ID": "test-client-id.apps.googleusercontent.com"})
    with app.app_context():
        db.create_all()
        for username, email, role in (("alya", "alya@student.uns.ac.id", "mahasiswa"), ("admin", "admin@student.uns.ac.id", "admin")):
            u = User(username=username, email=email, role=role, password_hash=hash_password("rahasia123"))
            db.session.add(u); db.session.flush()
            if role == "mahasiswa":
                db.session.add(Mahasiswa(nim="2024001", id_user=u.id_user, nama="Alya"))
        db.session.commit()
        yield app


@pytest.fixture()
def c(app):
    return app.test_client()


def reg(c, cred="tok-budi", **over):
    body = {"credential": cred, "password": "rahasia123", "nim": "V3925099"}
    body.update(over)
    return c.post("/api/v1/auth/register", json=body)


def admin_token(c):
    return c.post("/api/v1/auth/google", json={"credential": "tok-admin"}).get_json()["access_token"]


def import_roster(c, rows):
    return c.post("/api/v1/users/roster", json={"rows": rows}, headers={"Authorization": f"Bearer {admin_token(c)}"})


def test_config_publik(c):
    j = c.get("/api/v1/auth/config").get_json()
    assert j["google_enabled"] is True and j["google_client_id"].startswith("test-client-id")


def test_config_nonaktif_tanpa_client_id():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "RATELIMIT_ENABLED": False})
    with app.app_context():
        db.create_all()
        j = app.test_client().get("/api/v1/auth/config").get_json()
    assert j["google_enabled"] is False and j["google_client_id"] is None


def test_daftar_wajib_google_saat_aktif(c):
    r = c.post("/api/v1/auth/register", json={"name": "Budi", "email": "budi@gmail.com", "password": "rahasia123", "nim": "V3925099"})
    assert r.status_code == 400 and r.get_json()["code"] == "GOOGLE_WAJIB"


def test_daftar_dengan_google_langsung_terverifikasi_dan_bisa_login_password(c):
    r = reg(c)
    assert r.status_code == 201
    j = r.get_json()
    assert j["email"] == "budi@gmail.com" and j["email_verified"] is True and j["verification_required"] is False
    assert j["name"] == "Budi Santoso" and j["nim"] == "V3925099"
    r = c.post("/api/v1/auth/login", json={"username": "budi@gmail.com", "password": "rahasia123"})
    assert r.status_code == 200 and r.get_json()["role"] == "mahasiswa"


def test_email_diambil_dari_google_bukan_dari_form(c):
    r = reg(c, email="orang.lain@gmail.com")  # email di form diabaikan
    assert r.status_code == 201 and r.get_json()["email"] == "budi@gmail.com"


def test_token_google_palsu_ditolak(c):
    assert reg(c, cred="tok-ngasal").status_code == 401


def test_login_google_untuk_akun_terdaftar(c):
    r = c.post("/api/v1/auth/google", json={"credential": "tok-alya"})
    assert r.status_code == 200 and r.get_json()["user"]["nim"] == "2024001" and r.get_json()["access_token"]


def test_login_google_akun_belum_terdaftar_ditolak(c):
    r = c.post("/api/v1/auth/google", json={"credential": "tok-nobody"})
    assert r.status_code == 404 and r.get_json()["code"] == "GOOGLE_BELUM_TERDAFTAR"


def test_login_google_akun_nonaktif_ditolak(app, c):
    u = User.query.filter_by(username="alya").first()
    u.is_active = False
    db.session.commit()
    assert c.post("/api/v1/auth/google", json={"credential": "tok-alya"}).status_code == 401


def test_preview_memberi_email_nama_dan_status(c):
    j = c.post("/api/v1/auth/google/preview", json={"credential": "tok-budi"}).get_json()
    assert j["email"] == "budi@gmail.com" and j["name"] == "Budi Santoso" and j["already_registered"] is False
    assert c.post("/api/v1/auth/google/preview", json={"credential": "tok-alya"}).get_json()["already_registered"] is True


def test_daftar_dobel_ditolak(c):
    assert reg(c).status_code == 201
    assert reg(c, nim="V3925100").status_code == 409  # email sama
    assert reg(c, cred="tok-nobody", nim="V3925099").status_code == 409  # NIM sama


def test_domain_dibatasi_lewat_config(app, c):
    app.config["ALLOWED_EMAIL_DOMAINS"] = ["student.uns.ac.id"]
    r = reg(c)  # budi@gmail.com
    assert r.status_code == 422 and r.get_json()["code"] == "DOMAIN_TIDAK_DIIZINKAN"


def test_roster_membatasi_nim(c):
    assert import_roster(c, [{"nim": "V3925099", "nama": "Budi Santoso Resmi", "prodi": "D3 TI", "angkatan": 2025}]).status_code == 200
    assert reg(c, nim="V3925777").status_code == 422  # NIM tidak ada di roster
    r = reg(c)
    assert r.status_code == 201
    assert r.get_json()["name"] == "Budi Santoso Resmi"  # nama resmi dari roster


def test_roster_email_harus_cocok(c):
    import_roster(c, [{"nim": "V3925099", "nama": "Budi", "email": "orang.lain@gmail.com"}])
    r = reg(c)
    assert r.status_code == 422 and r.get_json()["code"] == "EMAIL_TIDAK_COCOK"


def test_preview_mengisi_nim_dari_roster(c):
    import_roster(c, [{"nim": "V3925099", "nama": "Budi Resmi", "email": "budi@gmail.com"}])
    j = c.post("/api/v1/auth/google/preview", json={"credential": "tok-budi"}).get_json()
    assert j["nim"] == "V3925099" and j["nama_resmi"] == "Budi Resmi"


def test_impor_roster_hanya_admin(c):
    tok = c.post("/api/v1/auth/google", json={"credential": "tok-alya"}).get_json()["access_token"]
    r = c.post("/api/v1/users/roster", json={"rows": [{"nim": "V3925099", "nama": "Budi"}]}, headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 403


def test_impor_roster_validasi_dan_upsert(c):
    assert import_roster(c, [{"nim": "12", "nama": "X"}]).status_code == 422
    r = import_roster(c, [{"nim": "V3925099", "nama": "Budi Satu"}]).get_json()
    assert r["added"] == 1 and r["updated"] == 0
    r = import_roster(c, [{"nim": "V3925099", "nama": "Budi Dua"}, {"nim": "V3925100", "nama": "Citra"}]).get_json()
    assert r["added"] == 1 and r["updated"] == 1 and r["total"] == 2
