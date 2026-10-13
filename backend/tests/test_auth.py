from tests.conftest import PASSWORD


def test_login_berhasil_mengembalikan_token_dan_profil(login):
    res = login("alya@student.uns.ac.id")
    body = res.get_json()
    assert res.status_code == 200
    assert body["role"] == "mahasiswa"
    assert body["user"]["nim"] == "2024001"
    assert body["access_token"] and body["refresh_token"]


def test_login_boleh_dengan_username_atau_email_kapital(login):
    assert login("ALYA").status_code == 200
    assert login("Alya@Student.UNS.ac.id").status_code == 200


def test_login_salah_password_dan_akun_tak_ada_pesannya_sama(login):
    salah = login("alya", "salahsalah")
    tak_ada = login("tidakada", PASSWORD)
    assert salah.status_code == tak_ada.status_code == 401
    assert salah.get_json() == tak_ada.get_json()


def test_login_password_terlalu_pendek_ditolak_422(login):
    assert login("alya", "123").status_code == 422


def test_akun_nonaktif_tidak_bisa_login(client, auth, login):
    admin = auth("admin")
    uid = login("alya").get_json()["user"]["id"]
    assert client.delete(f"/api/v1/users/{uid}", headers=admin).status_code == 200
    assert login("alya").status_code == 401


def test_token_lama_akun_nonaktif_langsung_ditolak(client, auth, login):
    admin = auth("admin")
    alya = auth("alya")
    uid = login("alya").get_json()["user"]["id"]
    client.delete(f"/api/v1/users/{uid}", headers=admin)
    assert client.get("/api/v1/auth/me", headers=alya).status_code == 401
    assert client.get("/api/v1/users", headers=alya).status_code == 401


def test_me_mengembalikan_profil(client, auth):
    res = client.get("/api/v1/auth/me", headers=auth("alya"))
    assert res.status_code == 200
    assert res.get_json()["email"] == "alya@student.uns.ac.id"


def test_me_tanpa_token_401(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_refresh_token_tidak_bisa_dipakai_sebagai_access(client, login):
    refresh = login("admin").get_json()["refresh_token"]
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {refresh}"})
    assert res.status_code == 401


def test_refresh_menghasilkan_access_token_baru(client, login):
    refresh = login("admin").get_json()["refresh_token"]
    res = client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {refresh}"})
    assert res.status_code == 200 and res.get_json()["access_token"]


def test_register_mahasiswa(client):
    res = client.post("/api/v1/auth/register", json={
        "name": "Tata Meirzha", "email": "tata@student.uns.ac.id", "password": PASSWORD, "nim": "2024006"})
    assert res.status_code == 201
    assert res.get_json()["role"] == "mahasiswa"


def test_register_menolak_email_non_sso_nim_duplikat_dan_nim_bukan_angka(client):
    base = {"name": "Tata Meirzha", "password": PASSWORD}
    assert client.post("/api/v1/auth/register", json={**base, "email": "t@gmail.com", "nim": "2024006"}).status_code == 422
    assert client.post("/api/v1/auth/register", json={**base, "email": "t@student.uns.ac.id", "nim": "abcdef"}).status_code == 422
    dup = client.post("/api/v1/auth/register", json={**base, "email": "t@student.uns.ac.id", "nim": "2024001"})
    assert dup.status_code == 409 and dup.get_json()["code"] == "NIM_SUDAH_ADA"


def test_register_tidak_bisa_memilih_role(client):
    res = client.post("/api/v1/auth/register", json={
        "name": "Penyusup", "email": "x@student.uns.ac.id", "password": PASSWORD, "nim": "2024009", "role": "admin"})
    assert res.status_code == 201 and res.get_json()["role"] == "mahasiswa"


def test_register_ditutup_lewat_config(app, client):
    app.config["ALLOW_SELF_REGISTER"] = False
    res = client.post("/api/v1/auth/register", json={
        "name": "Tata Meirzha", "email": "tata@student.uns.ac.id", "password": PASSWORD, "nim": "2024006"})
    assert res.status_code == 403


def test_rate_limit_login():
    from tests.conftest import make_app

    app = make_app(RATELIMIT_ENABLED=True)
    client = app.test_client()
    with app.app_context():
        codes = [client.post("/api/v1/auth/login", json={"username": "tidakada", "password": "salahsalah"}).status_code for _ in range(12)]
    assert codes[:10] == [401] * 10
    assert 429 in codes[10:]


def test_rate_limit_per_ip_klien_di_belakang_proxy_tepercaya():
    from tests.conftest import make_app

    app = make_app(RATELIMIT_ENABLED=True, TRUSTED_PROXIES=1)
    client = app.test_client()
    with app.app_context():
        def attempt(ip):
            return client.post("/api/v1/auth/login", json={"username": "tidakada", "password": "salahsalah"}, headers={"X-Forwarded-For": ip}).status_code

        assert [attempt("10.0.0.1") for _ in range(11)][-1] == 429
        assert attempt("10.0.0.2") == 401  # IP klien lain tidak ikut terkena
