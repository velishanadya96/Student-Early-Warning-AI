from tests.conftest import PASSWORD


def test_hanya_admin_boleh_melihat_dan_membuat_user(client, auth):
    assert client.get("/api/v1/users").status_code == 401
    assert client.get("/api/v1/users", headers=auth("alya")).status_code == 403
    assert client.get("/api/v1/users", headers=auth("dosen")).status_code == 403
    assert client.get("/api/v1/users", headers=auth("admin")).status_code == 200


def test_admin_membuat_semua_role(client, auth):
    admin = auth("admin")
    cases = [
        {"role": "kaprodi", "name": "Kaprodi Baru", "email": "kp@student.uns.ac.id"},
        {"role": "dosen", "name": "Dosen Baru", "email": "d2@student.uns.ac.id", "nidn": "0012345602"},
        {"role": "mahasiswa", "name": "Mhs Baru", "email": "m2@student.uns.ac.id", "nim": "2024010"},
        {"role": "orangtua", "name": "Ortu Baru", "email": "ortu2@example.com", "nim": "2024001"},
    ]
    for body in cases:
        res = client.post("/api/v1/users", json={**body, "password": PASSWORD}, headers=admin)
        assert res.status_code == 201, (body, res.get_json())


def test_validasi_pembuatan_user(client, auth):
    admin = auth("admin")
    post = lambda body: client.post("/api/v1/users", json={"password": PASSWORD, **body}, headers=admin)
    assert post({"role": "dosen", "name": "Dosen X", "email": "dx@student.uns.ac.id"}).status_code == 422          # NIDN wajib
    assert post({"role": "orangtua", "name": "Ortu X", "email": "x@example.com", "nim": "9999999"}).status_code == 404  # NIM anak tak ada
    assert post({"role": "admin", "name": "Admin X", "email": "ax@gmail.com"}).status_code == 422                    # internal wajib SSO


def test_username_otomatis_diberi_nomor_kalau_bentrok(client, auth):
    admin = auth("admin")
    res = client.post("/api/v1/users", json={
        "role": "orangtua", "name": "Ortu Lain", "email": "orangtua@student.uns.ac.id".replace("student.uns.ac.id", "contoh.id"),
        "password": PASSWORD, "nim": "2024001"}, headers=admin)
    assert res.status_code == 201
    assert res.get_json()["username"] == "orangtua2"


def test_admin_tidak_bisa_menonaktifkan_dirinya_sendiri(client, auth, login):
    admin = auth("admin")
    uid = login("admin").get_json()["user"]["id"]
    assert client.delete(f"/api/v1/users/{uid}", headers=admin).status_code == 400
    assert client.put(f"/api/v1/users/{uid}", json={"is_active": False}, headers=admin).status_code == 400
    assert client.put(f"/api/v1/users/{uid}", json={"is_active": True}, headers=admin).status_code == 200


def test_ubah_dan_aktifkan_kembali_akun(client, auth, login):
    admin = auth("admin")
    uid = login("alya").get_json()["user"]["id"]
    assert client.put(f"/api/v1/users/{uid}", json={"is_active": False}, headers=admin).get_json()["is_active"] is False
    assert login("alya").status_code == 401
    assert client.put(f"/api/v1/users/{uid}", json={"is_active": True}, headers=admin).status_code == 200
    assert login("alya").status_code == 200
