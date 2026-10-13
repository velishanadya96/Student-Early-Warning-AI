# Deploy ke server (internet)

Arsitektur: **Caddy** (satu-satunya yang terbuka, port 80/443, HTTPS otomatis) → **web** (Next.js) → **api** (Flask) → **MySQL** + **Redis** (rate limit). Hanya Caddy yang punya port publik; web, api, db, dan redis hanya terjangkau di jaringan Docker.

Sudah diuji di mesin lokal dengan `DOMAIN=localhost`: HTTPS dan redirect dari HTTP, cookie `Secure`+`HttpOnly`, header HSTS/CSP, port internal tertutup, IP klien tidak bisa dipalsukan lewat `X-Forwarded-For`, rate limit lewat Redis, user MySQL non-root, dan pembuatan admin lewat CLI. **Belum diuji** di server internet sungguhan dengan domain asli (butuh domain dan server milik kamu).

## 1. Yang harus disiapkan
- Server Linux (VPS) dengan Docker + Docker Compose, port 80 dan 443 terbuka di firewall.
- **Domain** dengan record DNS A/AAAA ke IP server (Caddy butuh ini untuk mendapat sertifikat Let's Encrypt).
- **SMTP asli** untuk email verifikasi/reset: SMTP kampus, atau layanan seperti Brevo/Resend/Mailgun. Atur SPF/DKIM di domain pengirim supaya email tidak masuk spam.

## 2. Konfigurasi
```bash
git clone <repo> && cd <repo>
cp .env.example .env
```
Isi di `.env` (bagian *production*):

| Variabel | Isi |
|---|---|
| `DOMAIN` | domain publik, mis. `sew.kampus.ac.id` |
| `JWT_SECRET_KEY` | string acak >= 32 karakter: `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `MYSQL_ROOT_PASSWORD`, `MYSQL_APP_PASSWORD` | dua password berbeda, karakter aman untuk URL (huruf, angka, `-_.`) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_USE_TLS`, `MAIL_FROM` | SMTP asli |

Batasi izin file: `chmod 600 .env`. Jangan commit `.env`.

## 3. Jalankan
```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps          # semua harus Up/healthy
docker compose -f docker-compose.prod.yml exec api flask --app run.py create-admin
```
`create-admin` meminta email (`@student.uns.ac.id`), nama, dan password. **Jangan menjalankan `seed.py`** di production: itu membuat akun demo (seed memang menolak password `123456`). Buka `https://DOMAIN`, masuk sebagai admin, lalu buat akun Dosen PA, Kaprodi, dan Orang Tua lewat Manajemen Pengguna. Mahasiswa mendaftar sendiri dan memverifikasi email.

## 4. Operasional
- **Backup** (jadwalkan dengan cron, mis. harian) dan simpan salinannya di luar server:
  ```bash
  COMPOSE_FILE=docker-compose.prod.yml ./scripts/backup-db.sh /var/backups/sew
  0 2 * * * cd /path/ke/repo && COMPOSE_FILE=docker-compose.prod.yml ./scripts/backup-db.sh /var/backups/sew
  ```
  Pulihkan dengan `COMPOSE_FILE=docker-compose.prod.yml ./scripts/restore-db.sh <file>`. **Uji pemulihan** sebelum mengandalkannya.
- **Update:** `git pull && docker compose -f docker-compose.prod.yml up -d --build`. Migrasi database berjalan otomatis saat `api` start.
- **Log:** `docker compose -f docker-compose.prod.yml logs -f api web caddy`.
- **Rotasi secret:** mengganti `JWT_SECRET_KEY` membuat semua sesi berakhir (pengguna login ulang).
- **Pembaruan keamanan:** aktifkan Dependabot (`.github/dependabot.yml` sudah ada) dan bangun ulang image secara berkala.

## 5. Checklist sebelum dibuka ke mahasiswa
- [ ] `https://DOMAIN` terbuka dengan gembok, HTTP mengalihkan ke HTTPS.
- [ ] Email verifikasi sampai ke kotak surat asli (bukan spam). Coba daftar dengan akun uji.
- [ ] Tidak ada akun demo; hanya admin yang dibuat lewat CLI.
- [ ] Backup berjalan terjadwal **dan** pemulihannya sudah dicoba.
- [ ] `docker compose ... ps` semua sehat; `db`, `redis`, `api`, `web` tidak terjangkau dari luar (`nmap` ke server hanya menunjukkan 80/443).
- [ ] Data akademik masih **mock** sampai modul backend import/risk selesai: jangan menjanjikan data nyata dulu.
- [ ] Ada pihak lain yang meninjau konfigurasi, dan Anda sudah membaca `docs/KEAMANAN.md` (batasan yang tersisa).
- [ ] Kebijakan privasi/persetujuan pengguna sesuai aturan kampus (data mahasiswa adalah data pribadi).
