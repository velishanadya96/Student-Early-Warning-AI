# Backend Student Early Warning AI

Flask 3 (Blueprint per modul) + SQLAlchemy 2 + Flask-Migrate + JWT + bcrypt + Pydantic, sesuai
*Dokumen Arsitektur Backend SEW v1.0*. Tahap ini: **FR-01 Login**, **FR-12 Kelola akun**, dan seluruh
skema database (10 tabel). Modul import/risk/dashboard/catatan/notifikasi/laporan menyusul (sampai saat itu
frontend memakai mock API untuk data akademik, lihat README di root repo).

Semua perintah di bawah dijalankan dari folder `backend/`.

## Jalankan lokal (tanpa Docker)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env
```
Isi `.env`:
- `APP_ENV=development`
- `JWT_SECRET_KEY`: string acak minimal 32 karakter. Frontend memakai nilai yang **sama** untuk memverifikasi token.
  Buat dengan `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- `DATABASE_URL`: MySQL (XAMPP) atau `sqlite:///sew.db` untuk coba cepat.

Siapkan database lalu jalankan:
```bash
flask --app run.py db upgrade   # atau import database/schema.sql di phpMyAdmin
python seed.py                  # 9 akun demo (password demo 123456, atau isi SEED_PASSWORD)
python run.py                   # http://127.0.0.1:5000
```
`APP_ENV` kosong dianggap `production` dan server **menolak start** kalau `JWT_SECRET_KEY` lemah.
Debugger Flask hanya menyala saat `APP_ENV=development`, dan hanya di `127.0.0.1`.

## Jalankan dengan Docker
`docker-compose.yml` ada di **root repo** (frontend + backend + MySQL + Mailpit); lihat README root. Container `api` menjalankan `flask db upgrade` otomatis saat start dan menunggu MySQL sehat. `database/schema.sql` dihasilkan dari model (`python scripts/generate_schema_sql.py`) dan aman diimpor ulang.

## Test
```bash
pip install -r requirements-dev.txt
APP_ENV=testing pytest
```

## Endpoint (/api/v1)
| Method | URL | Akses | Keterangan |
|---|---|---|---|
| POST | /auth/login | publik | body `username` (atau email) + `password` -> `access_token`, `refresh_token`, `role`, `user` |
| GET | /auth/me | token | profil akun yang sedang login (401 kalau akun nonaktif) |
| POST | /auth/refresh | refresh token | access token baru |
| POST | /auth/logout | token | mencabut token yang dikirim (panggil untuk access dan refresh) |
| POST | /auth/verify-email | publik | body `token` dari email; menandai email terverifikasi |
| POST | /auth/resend-verification | publik | body `email`; jawaban sama untuk email terdaftar atau tidak |
| POST | /auth/forgot-password | publik | body `email`; kirim tautan reset (jawaban sama) |
| POST | /auth/reset-password | publik | body `token` + `password`; token sekali pakai |
| POST | /auth/register | publik* | *tambahan: daftar mandiri khusus mahasiswa (`ALLOW_SELF_REGISTER`) |
| GET/POST | /users | admin | daftar / buat akun semua role |
| PUT/DELETE | /users/{id} | admin | ubah / nonaktifkan akun (admin tidak bisa menonaktifkan dirinya sendiri) |
| PATCH | /users/mahasiswa/{nim}/dosen-pa | admin | tugaskan Dosen PA |
| GET | /health | publik | cek ketersediaan |

Akun dikunci 15 menit setelah 5 kali salah password (`MAX_FAILED_LOGINS`, `LOCK_MINUTES`). Pendaftaran mandiri butuh verifikasi email (`REQUIRE_EMAIL_VERIFICATION`); akun buatan Admin dan akun seed langsung terverifikasi. Email dikirim lewat SMTP (`MAIL_*`); tanpa `MAIL_HOST` tautannya dicetak di log. Di belakang proxy (frontend), isi `TRUSTED_PROXIES=1` agar rate limit per IP klien.

Error: `{"code": "KREDENSIAL_SALAH", "message": "..."}` (Indonesia, kode konsisten - NFR-07).
Rate limit: login 10/menit, register 5/menit, refresh 30/menit per IP (penyimpanan memori per proses; untuk
beberapa worker/instance pakai Redis lewat `RATELIMIT_STORAGE_URI`). Access token 15 menit, refresh token 7 hari (NFR-01).
Role dan status aktif dibaca dari database pada setiap request ber-RBAC, jadi akun yang dinonaktifkan langsung kehilangan akses.

## Akun demo
`admin@` , `kaprodi@` , `dosen@` , `alya@` ... `eka@` + `student.uns.ac.id`, serta `orangtua@example.com` (memantau Alya, NIM 2024001). Password demo `123456` (hanya untuk lokal).

## Catatan: beda kecil dari dokumen
- `/auth/register` tidak ada di dokumen (akun resminya dibuat Admin lewat `POST /users`); dibuat karena halaman Register frontend sudah ada. Matikan dengan `ALLOW_SELF_REGISTER=false`.
- `/auth/me` ditambahkan agar frontend bisa memulihkan sesi.
- Tabel `notifikasi` ditambah kolom `dibaca` (untuk `PATCH /notifikasi/{id}/baca`), tidak ada di class diagram.
- `user.is_active` ditambahkan untuk "DELETE = nonaktifkan".
- Role `orangtua` ditambahkan: tabel `orang_tua` (id_orang_tua, id_user, nim anak, nama). Akun dibuat Admin lewat `POST /users` dengan `role: orangtua` + `nim` mahasiswa yang dipantau; emailnya boleh non-SSO. Role `staff` di frontend tidak ada di database.

## Belum ada
- Fitur nomor WA (commit "Tambah fitur No WA dan Login Ortu" hanya menambah `.env.example`; tidak ada kolom/endpoint nomor telepon).
- Modul import, risk, dashboard, catatan, notifikasi, laporan.
