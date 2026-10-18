"""Akun demo (sama dengan DEFAULT_USERS frontend, kecuali role staff yang tidak ada di arsitektur).
Jalankan setelah tabel dibuat:  python seed.py   (aman diulang)"""
from app import create_app
from app.extensions import db
from app.models import User, DosenPA, Mahasiswa, OrangTua
from app.security import hash_password

PASSWORD = "123456"
PRODI = "D3 Teknik Informatika"
app = create_app()

with app.app_context():
    db.create_all()  # no-op kalau tabel sudah dibuat lewat flask db upgrade / schema.sql

    def add_user(username, email, role):
        u = User.query.filter_by(email=email).first()
        if u:
            return u, False
        u = User(username=username, email=email, role=role, password_hash=hash_password(PASSWORD))
        db.session.add(u)
        db.session.flush()
        return u, True

    u, _ = add_user("admin", "admin@student.uns.ac.id", "admin")
    u, _ = add_user("kaprodi", "kaprodi@student.uns.ac.id", "kaprodi")

    u, new = add_user("dosen", "dosen@student.uns.ac.id", "dosen")
    if new:
        db.session.add(DosenPA(id_user=u.id_user, nidn="0012345601", nama="Dosen PA", prodi=PRODI, no_wa="6281234567801"))
        db.session.flush()
    dosen = DosenPA.query.filter_by(nidn="0012345601").first()

    mahasiswa = [
        ("alya", "Alya Putri", "2024001", 2024, 3.72),
        ("bagas", "Bagas Pratama", "2024002", 2024, 2.90),
        ("citra", "Citra Lestari", "2024003", 2024, 3.10),
        ("dimas", "Dimas Ramadhan", "2024004", 2023, 3.00),
        ("eka", "Eka Sari", "2024005", 2023, 2.20),
    ]
    for username, nama, nim, angkatan, ipk in mahasiswa:
        u, new = add_user(username, f"{username}@student.uns.ac.id", "mahasiswa")
        if new:
            db.session.add(Mahasiswa(nim=nim, id_user=u.id_user, id_dosen_pa=dosen.id_dosen_pa if dosen else None,
                                     nama=nama, prodi=PRODI, angkatan=angkatan, ipk=ipk))
    db.session.flush()
    # Orang tua (email non-SSO) memantau Alya Putri (2024001)
    u, new = add_user("orangtua", "orangtua@example.com", "orangtua")
    if new:
        db.session.add(OrangTua(id_user=u.id_user, nim="2024001", nama="Orang Tua Mahasiswa", no_wa="6281234567802"))
    # Orang tua mahasiswa berisiko tinggi (tujuan WhatsApp peringatan dini): Citra (kehadiran), Eka (IPK)
    for username, nim, nama, wa in (("ortu-citra", "2024003", "Orang Tua Citra", "6281234567803"),
                                    ("ortu-eka", "2024005", "Orang Tua Eka", "6281234567804")):
        u, new = add_user(username, f"{username}@example.com", "orangtua")
        if new:
            db.session.add(OrangTua(id_user=u.id_user, nim=nim, nama=nama, no_wa=wa))
    db.session.commit()

    # Data akademik contoh (CSV) -> hitung skor risiko. Aman diulang: impor menimpa data periode yang sama,
    # notifikasi hanya dibuat saat mahasiswa baru masuk kategori High.
    import os
    from app import impor, risk

    class _Berkas:
        def __init__(self, path):
            self.filename, self._path = os.path.basename(path), path

        def read(self):
            with open(self._path, "rb") as f:
                return f.read()

    contoh = os.path.join(os.path.dirname(os.path.abspath(__file__)), "contoh")
    if os.path.exists(os.path.join(contoh, "akademik_2026-1.csv")) and os.path.exists(app.config["MODEL_PATH"]):
        impor.impor_akademik(_Berkas(os.path.join(contoh, "akademik_2026-1.csv")), "2026-1")
        impor.impor_tugas(_Berkas(os.path.join(contoh, "tugas_2026-1.csv")), "2026-1")
        r = risk.hitung("2026-1")
        print(f"Data contoh diimpor, risiko dihitung: Tinggi={r['High']} Sedang={r['Medium']} Rendah={r['Low']}, WA ortu dibuat={r['notifikasi_wa']}")
    print(f"Seed selesai. Total akun: {User.query.count()} (password demo: {PASSWORD})")
