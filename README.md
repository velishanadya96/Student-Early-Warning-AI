# Backend Student Early Warning AI

Flask 3 (Blueprint per modul) + SQLAlchemy 2 + Flask-Migrate + JWT + bcrypt + Pydantic, sesuai
*Dokumen Arsitektur Backend SEW v1.0*. Tahap ini: **FR-01 Login**, **FR-12 Kelola akun**, dan seluruh
skema database (10 tabel). Modul import/risk/dashboard/catatan/notifikasi/laporan menyusul.

## Jalankan (Windows)
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```
**Database MySQL (XAMPP):** start MySQL, lalu import `database/schema.sql` di phpMyAdmin
(atau `flask db upgrade`). Tanpa MySQL: di `.env` ganti `DATABASE_URL=sqlite:///sew.db`.
```powershell
python seed.py      # 9 akun demo, password 123456
python run.py       # http://127.0.0.1:5000
```

## Endpoint (/api/v1)
| Method | URL | Akses | Keterangan |
|---|---|---|---|
| POST | /auth/login | publik | body `username` (atau email) + `password` -> `access_token`, `refresh_token`, `role`, `user` |
| POST | /auth/login-ortu | publik | body `nim` + `email` (email mahasiswa) + `password` orang tua -> token + user |
| POST | /auth/register-ortu | publik | body `name,email,password,nim,email_mahasiswa,no_wa` -> akun orang tua (diverifikasi NIM+email anak, 1 mahasiswa = 1 akun) |
| GET | /kontak/ortu | dosen | mahasiswa bimbingan + nama & no WA orang tua |
| GET | /kontak/dosen-pa | orangtua | nama & no WA Dosen PA anak |
| POST | /auth/refresh | refresh token | access token baru |
| POST | /auth/register | publik* | *tambahan: daftar mandiri khusus mahasiswa (`ALLOW_SELF_REGISTER`) |
| GET/POST | /users | admin | daftar / buat akun semua role |
| PUT/DELETE | /users/{id} | admin | ubah / nonaktifkan akun |
| PATCH | /users/mahasiswa/{nim}/dosen-pa | admin | tugaskan Dosen PA |
| GET | /health | publik | cek ketersediaan |

Error: `{"code": "KREDENSIAL_SALAH", "message": "..."}` (Indonesia, kode konsisten - NFR-07).
Login dibatasi 30 percobaan/menit per IP (`LOGIN_RATE_LIMIT`; front-end memanggil lewat Next sehingga semua pengguna terlihat dari satu IP). Access token 15 menit, refresh token 7 hari (NFR-01).

## Akun demo
`admin@` , `kaprodi@` , `dosen@` , `alya@` ... `eka@` + `student.uns.ac.id`, serta `orangtua@example.com` (memantau Alya, NIM 2024001). Password semua `123456`.

## Catatan: beda kecil dari dokumen
- `/auth/register` tidak ada di dokumen (akun resminya dibuat Admin lewat `POST /users`); dibuat karena halaman Register frontend sudah ada. Matikan dengan `ALLOW_SELF_REGISTER=false`.
- Tabel `notifikasi` ditambah kolom `dibaca` (untuk `PATCH /notifikasi/{id}/baca`), tidak ada di class diagram.
- `user.is_active` ditambahkan untuk "DELETE = nonaktifkan".
- Role `orangtua` ditambahkan: tabel `orang_tua` (id_orang_tua, id_user, nim anak, nama). Akun dibuat Admin lewat `POST /users` dengan `role: orangtua` + `nim` mahasiswa yang dipantau; emailnya boleh non-SSO. Role `staff` di frontend tidak ada di database.

## Update: no WhatsApp (notifikasi orang tua)
- Kolom baru `no_wa` di tabel `dosen_pa` dan `orang_tua`. Jalankan `flask --app run db upgrade` (migrasi `a1b2c3d4e5f6`).
- Nomor dinormalisasi ke format `62xxxxxxxxxx` (input `0812-3456-7890` atau `+62 812...` diterima).
- No WA Dosen PA di dashboard orang tua dan no WA orang tua di dashboard Dosen PA diambil lewat relasi (tidak disalin antar tabel).
- Akun Dosen PA dan orang tua yang dibuat Admin (`POST /users`) wajib mengisi `no_wa`.
