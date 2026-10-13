# Student Early Warning AI

Sistem peringatan dini risiko akademik mahasiswa, dibuat berdasarkan SKPL dan kebutuhan praktikum.

- **Frontend** (root repo): Next.js. Data akademik (mahasiswa, risk score, catatan tindak lanjut) masih **mock** di memori server.
- **Backend** ([`backend/`](backend/README.md)): Flask + MySQL/SQLite. Saat ini mengurus **login, pendaftaran, dan manajemen akun** (JWT + bcrypt). Modul import/risk/dashboard/catatan menyusul; sampai saat itu frontend memakai mock API untuk data akademik.

Frontend **membutuhkan backend berjalan** untuk login.

## Role
| Role | Dashboard | Keterangan |
|---|---|---|
| Dosen PA | `/dashboard` | Memantau mahasiswa bimbingan, CRUD data mahasiswa, catatan tindak lanjut |
| Mahasiswa | `/dashboard-mahasiswa` | Kondisi akademik, status risiko, rekomendasi, profil |
| Kaprodi | `/dashboard-kaprodi` | Ringkasan dan laporan risiko tingkat prodi |
| Admin | `/dashboard-admin` | Impor data akademik (CSV), manajemen pengguna |
| Orang Tua | `/dashboard-orangtua` | Memantau satu mahasiswa yang dipilih saat login |

> Role Orang Tua adalah pengembangan tambahan. SRS versi 1.0 mendefinisikan empat aktor: Admin, Dosen PA, Kaprodi, dan Mahasiswa.

## Akun demo
Dibuat oleh `python seed.py` di backend. Passwordnya = `SEED_PASSWORD` yang kamu isi saat seed (default `123456` hanya untuk seed lokal tanpa Docker). Di **Docker demo** halaman login punya dropdown **Akun demo** yang mengisi email, jenis akun, dan password otomatis (mode demo: `DEMO_MODE=1`). Tanpa mode demo (compose production, atau `npm run dev` tanpa `DEMO_MODE`) dropdown tidak tampil. **Jangan aktifkan `DEMO_MODE` di server publik**, karena password demo ikut terkirim ke browser.

| Role | Email |
|---|---|
| Mahasiswa, Alya Putri (2024001), risiko Rendah | `alya@student.uns.ac.id` |
| Mahasiswa, Bagas Pratama (2024002), risiko Sedang | `bagas@student.uns.ac.id` |
| Mahasiswa, Citra Lestari (2024003), risiko Tinggi | `citra@student.uns.ac.id` |
| Mahasiswa, Dimas Ramadhan (2024004), risiko Rendah | `dimas@student.uns.ac.id` |
| Mahasiswa, Eka Sari (2024005), risiko Sedang | `eka@student.uns.ac.id` |
| Dosen PA | `dosen@student.uns.ac.id` |
| Kaprodi | `kaprodi@student.uns.ac.id` |
| Admin | `admin@student.uns.ac.id` |
| Orang Tua (memantau Alya, NIM 2024001) | `orangtua@example.com` |

### Akun dan pendaftaran
- `/register` hanya untuk **mahasiswa** (email `@student.uns.ac.id`, NIM angka unik). Role lain tidak bisa dipilih lewat pendaftaran.
- **Verifikasi email:** akun baru harus mengklik tautan di email (berlaku 24 jam) sebelum bisa masuk. Ada tombol kirim ulang di halaman login.
- **Lupa password:** `/forgot-password` mengirim tautan reset (berlaku 60 menit, sekali pakai).
- **Penguncian:** 5 kali salah password mengunci akun 15 menit.
- Email dikirim lewat SMTP (`MAIL_*` di backend). Tanpa SMTP, tautan dicetak di log backend; dengan `docker compose`, email tertampung di Mailpit (http://localhost:8025).
- Akun Dosen PA, Kaprodi, Admin, dan Orang Tua dibuat Admin lewat **Manajemen Pengguna**. Akun Orang Tua dikaitkan ke satu mahasiswa (NIM) oleh Admin, bukan dipilih sendiri saat login.
- Akun tersimpan di database backend. Admin bisa menonaktifkan akun (efek langsung) tetapi tidak bisa menonaktifkan akunnya sendiri.
- Mahasiswa dengan NIM yang belum ada di data akademik mock melihat "Data akademik belum tersedia". Data muncul setelah Admin/Dosen menambahkan NIM itu (CRUD atau impor CSV).

## Risk score
Risk score dihitung dengan **rumus berbobot (rule-based)**, bukan model machine learning:

`skor = 0,3 x (100 - presensi) + 0,3 x (100 - IPK/4 x 100) + 0,2 x (100 - LMS) + 0,2 x (100 - tugas)`

Kategori: **Tinggi** bila skor >= 70, **Sedang** bila >= 40, selain itu **Rendah**. Rumus ada di satu tempat: [`lib/risk.ts`](lib/risk.ts).

## Teknologi
Frontend: Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS v4, CVA, Zod, Zustand, TanStack Query, Middleware, jose (verifikasi JWT), ESLint, Vitest. Backend: Flask 3, SQLAlchemy 2, JWT, bcrypt, Pydantic, pytest, Docker.

## Menjalankan (frontend + backend)

**1. Backend** (terminal pertama, detail lengkap di [`backend/README.md`](backend/README.md)):
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # isi JWT_SECRET_KEY (>= 32 karakter), APP_ENV=development, DATABASE_URL
flask --app run.py db upgrade
python seed.py
python run.py               # http://127.0.0.1:5000
```
> macOS: port 5000 dipakai AirPlay Receiver. Kalau `http://127.0.0.1:5000/api/v1/health` tidak menjawab `{"status":"ok"}`, jalankan `PORT=5001 python run.py` dan set `BACKEND_URL=http://127.0.0.1:5001` di frontend.

**Windows (PowerShell)**, padanan langkah backend di atas:
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # isi JWT_SECRET_KEY, APP_ENV=development
flask --app run.py db upgrade
python seed.py
python run.py
```
Variabel lingkungan sesaat di PowerShell: `$env:PORT="5001"; python run.py` dan `$env:APP_ENV="testing"; pytest`. Untuk frontend, ganti `cp` dengan `copy`. Docker Desktop (mode WSL2) bisa dipakai untuk `docker compose up --build` di folder `backend`.

**2. Frontend** (terminal kedua, dari root repo):
```bash
npm install
cp .env.example .env.local  # JWT_SECRET_KEY HARUS sama dengan backend/.env
npm run dev
```
Buka http://localhost:3000. Tanpa `JWT_SECRET_KEY` saat `npm run dev`, frontend memakai secret development bawaan backend (hanya cocok jika backend `APP_ENV=development` dan `JWT_SECRET_KEY` kosong). Di production `JWT_SECRET_KEY` wajib diisi.

| Perintah | Fungsi |
|---|---|
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm run lint` | ESLint (`next/core-web-vitals` + `next/typescript`) |
| `npm test` | Test frontend: logika (risiko, CSV, JWT, akses), middleware, dan komponen React (form login/daftar/reset, dialog) |
| `npm test -- --coverage` | Sama, dengan laporan cakupan |
| `npm run build` | Build produksi |
| `APP_ENV=testing pytest` (di `backend/`) | Test backend |

Data mahasiswa dan catatan tindak lanjut (mock) kembali ke data awal setiap server frontend di-restart.

## Menjalankan dengan Docker (satu perintah)
Frontend, backend, MySQL, dan kotak surat tiruan (Mailpit) sekaligus:
```bash
cp .env.example .env     # isi JWT_SECRET_KEY (>= 32 karakter), MYSQL_ROOT_PASSWORD, SEED_PASSWORD
docker compose up --build
docker compose exec api python seed.py     # akun demo, sekali saja
```
Buka http://localhost:3000. Email verifikasi/reset tampil di http://localhost:8025. Cadangkan dan pulihkan database dengan `./scripts/backup-db.sh` dan `./scripts/restore-db.sh <file>`.
Mailpit hanya untuk demo (email tidak benar-benar terkirim). Untuk email sungguhan isi `MAIL_*` dengan SMTP asli.

## Deploy ke internet
Lihat [`docs/DEPLOY.md`](docs/DEPLOY.md): `docker-compose.prod.yml` (Caddy HTTPS otomatis, Redis, MySQL, tanpa akun demo), langkah, backup terjadwal, dan checklist. Ingin berkontribusi? Cukup fork dan buka pull request, lihat [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Cara kerja autentikasi
Browser tidak pernah memegang token yang bisa dibaca JavaScript. Login lewat route Next.js (`/api/auth/login`) yang meneruskan ke backend Flask, lalu menyimpan token di **cookie HttpOnly**. Middleware memverifikasi tanda tangan JWT di setiap halaman dan `/api/*`, memperbarui access token otomatis lewat refresh token, dan data API disaring per pengguna (mahasiswa/orang tua hanya melihat NIM miliknya). Logout mencabut kedua token di backend, dan route data memeriksa ke backend bahwa sesi belum dicabut atau akunnya belum dinonaktifkan. Rinciannya di [`docs/KEAMANAN.md`](docs/KEAMANAN.md).

## Dokumentasi
- [`docs/README_MODUL.md`](docs/README_MODUL.md) checklist praktikum
- [`docs/MODUL-6.md`](docs/MODUL-6.md) App Router, RSC, streaming
- [`docs/MATRIKS_SRS_VS_FRONTEND.md`](docs/MATRIKS_SRS_VS_FRONTEND.md) kebutuhan SRS vs implementasi
- [`docs/MATRIKS_STATE.md`](docs/MATRIKS_STATE.md) pemisahan state
- [`docs/CRUD_FIX.md`](docs/CRUD_FIX.md) CRUD data mahasiswa
- [`docs/KEAMANAN.md`](docs/KEAMANAN.md) model keamanan dan batasan yang tersisa

## Modul 8, Build Tools Modern
Dikerjakan sebagai subproject terpisah di [`modul-8-vite/`](modul-8-vite/) karena aplikasi utama memakai Next.js App Router. Berisi Vite + React + Strict TypeScript + Biome, path alias, manual chunks, demo HMR, konfigurasi SonarQube, matriks migrasi, dan benchmark PDF. CI untuk kedua proyek ada di [`.github/workflows/quality.yml`](.github/workflows/quality.yml).
