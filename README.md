# Backend Student Early Warning AI

Flask 3 (Blueprint per modul) + SQLAlchemy 2 + Flask-Migrate + JWT + bcrypt + Pydantic, sesuai
*Dokumen Arsitektur Backend SEW v1.0*. Tahap ini: **FR-01 s/d FR-12** (login, akun, impor data, risiko, dashboard, catatan, notifikasi WA, laporan) dan seluruh
skema database (10 tabel). 

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

## Login Google & roster
- `GET /auth/config` (publik): status Google, domain yang diizinkan, apakah roster aktif.
- `POST /auth/google/preview` (publik): cek ID token Google sebelum daftar (email, nama, NIM dari roster).
- `POST /auth/register`: kalau `GOOGLE_CLIENT_ID` diisi, wajib `credential` (ID token Google). Email = email Google (otomatis terverifikasi).
- `POST /auth/google`: login dengan Google (akun harus sudah terdaftar, kalau belum 404 `GOOGLE_BELUM_TERDAFTAR`).
- `POST /users/roster` (admin) & `GET /users/roster/count`: daftar mahasiswa resmi. Jika terisi, daftar mandiri wajib NIM terdaftar + email cocok.
- Env: `GOOGLE_CLIENT_ID`, `ALLOWED_EMAIL_DOMAINS` (kosong = semua domain). Migrasi `c3d4e5f6a7b8`.

## Pipeline data, risiko, dan notifikasi (FR-02 ... FR-11)
Format file impor: lihat `FORMAT_CSV.md`. Contoh siap pakai di folder `contoh/` (dibuat ulang dengan `python contoh/buat_contoh.py`).
Migrasi baru `d4e5f6a7b8c9` (jalankan `flask --app run db upgrade`; Docker otomatis).

| Method | URL | Akses | Keterangan |
|---|---|---|---|
| POST | /import/akademik, /import/tugas | admin | multipart `file` (.csv/.xlsx) + `periode`; semua-atau-tidak-sama-sekali, error per baris |
| GET | /import/format | admin | daftar kolom |
| POST | /risk/hitung | admin | `{"periode":"2026-1"}` -> hitung skor, buat notifikasi untuk yang baru High |
| GET | /risk/periode | login | periode yang punya data |
| GET | /risk/{nim} | sesuai kepemilikan | skor terbaru, fitur, penyebab, riwayat |
| GET | /dashboard/dosen, /kaprodi, /admin, /mahasiswa, /ortu | per role | data dashboard dari DB (`?periode=`) |
| POST/GET | /catatan | dosen (GET: + mahasiswa) | catatan tindak lanjut; `isi_pesan` = pesan ke mahasiswa |
| GET | /laporan?format=xlsx\|pdf&periode= | kaprodi, admin, dosen (bimbingan) | unduh laporan |
| GET | /notifikasi | login | notifikasi dashboard milik sendiri |
| PATCH | /notifikasi/{id}/baca | pemilik | tandai dibaca |
| GET | /notifikasi/wa-ortu | dosen/kaprodi/admin | pesan WA ke orang tua + tautan wa.me |
| POST | /notifikasi/{id}/terkirim, /kirim-ulang | dosen, admin | tandai terkirim (mode manual) / kirim ulang |
| POST | /notifikasi/proses | admin | proses antrean WA (provider otomatis) |

**Model**: `ml/model_final.pkl` (Random Forest, 4 fitur: GPA, avg_course_grade, attendance_rate, assignment_submission_rate;
ambang High = peluang >= 0,4). Dibuat oleh notebook `SEW_FINAL_perbaikan.ipynb` atau `python ml/latih_model.py`.
Versi scikit-learn **harus 1.6.1** (sama dengan requirements.txt). Kontrak input/output: `ml/KONTRAK.md`.
**Penyebab risiko**: untuk tiap fitur, peluang High dibandingkan dengan peluang bila fitur itu diganti nilai tipikal
(median); fitur yang memperburuk dan menurunkan peluang paling besar = penyebab utama (`app/risk.py`).

**WhatsApp** (`.env`): `WA_PROVIDER=manual|fonnte|log`, `FONNTE_TOKEN`, `WA_MAX_RETRY=3`, `WA_RETRY_INTERVAL=300`.
Docker menjalankan service `worker` (`python worker.py`) untuk mencoba ulang pengiriman otomatis.

Akun demo ditambah: `ortu-citra@example.com` (NIM 2024003, kehadiran rendah) dan `ortu-eka@example.com` (NIM 2024005, IPK rendah).
Seed mengimpor `contoh/*.csv` periode 2026-1 dan menghitung risiko otomatis.
Tes: `pip install pytest` lalu `python -m pytest -q` (75 tes).
