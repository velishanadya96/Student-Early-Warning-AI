# Cara memasang dan menjalankan SEW-AI (localhost)

Butuh: Git, Node.js 20+, dan **salah satu**: Docker Desktop (paling gampang) **atau** Python 3.12.

## 1. Ambil kode

```bash
git clone -b frontend-integrasi https://github.com/velishanadya96/Student-Early-Warning-AI.git sew
cd sew
git clone -b backend https://github.com/velishanadya96/Student-Early-Warning-AI.git sew-be
```

Folder `sew-be` sudah ada di `.gitignore`, jadi tidak ikut ke-commit di front-end.

## 2. Siapkan `.env` backend

```bash
cd sew-be
copy .env.example .env        # macOS/Linux: cp .env.example .env
```

Untuk demo cepat, ubah di `.env`:

```
EMAIL_VERIFICATION_REQUIRED=false
GOOGLE_CLIENT_ID=<Client ID Google, opsional>
```

`GOOGLE_CLIENT_ID` kosong = tombol Google disembunyikan dan daftar memakai verifikasi email.
Cara membuat Client ID ada di bagian [Login Google](#login-google).

## 3. Jalankan backend

### Pilihan A: Docker (disarankan)

```bash
cd sew-be
docker compose up --build
```

MySQL, migrasi tabel, dan akun demo dibuat otomatis. Tunggu sampai log tenang (pertama kali bisa 5-10 menit).

### Pilihan B: Python

```bash
cd sew-be
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Di `.env`, pilih database:

- Tanpa MySQL: `DATABASE_URL=sqlite:///sew.db`
- MySQL (XAMPP): start MySQL, buat database `student_early_warning`, pakai `DATABASE_URL` bawaan.

```bash
flask --app run db upgrade
python seed.py
python run.py
```

Cek: buka <http://127.0.0.1:5000/api/v1/health>.

## 4. Jalankan front-end

Di folder `sew` (terminal baru):

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Alamat backend default `http://127.0.0.1:5000`; kalau beda, buat `.env.local`
berisi `NEXT_PUBLIC_API_URL=http://alamat-backend:5000/api/v1`.

## 5. Akun demo

Password semua `123456`:
`admin@`, `kaprodi@`, `dosen@`, `alya@`, `bagas@`, `citra@`, `dimas@`, `eka@` + `student.uns.ac.id`.
Orang tua: buka `/login-ortu`, isi NIM `2024001`, email `alya@student.uns.ac.id`, password `123456`.

Alur demo: login **Admin** > Data Akademik > unggah `public/templates/contoh-akademik-2026-1.csv` dan
`contoh-tugas-2026-1.csv` > **Hitung risiko**. Lalu login **Dosen PA** untuk melihat daftar risiko dan pesan WA ke orang tua.

## Login Google

1. <https://console.cloud.google.com> > APIs & Services > **OAuth consent screen**: pilih External,
   tambahkan akun penguji di **Test users**.
2. **Credentials** > Create credentials > **OAuth client ID** > tipe **Web application**.
3. **Authorized JavaScript origins**: `http://localhost:3000` dan `http://127.0.0.1:3000`.
4. Salin Client ID (berakhiran `.apps.googleusercontent.com`) ke `GOOGLE_CLIENT_ID` di `.env` backend,
   lalu restart backend. Client secret tidak dipakai.
5. Cek <http://127.0.0.1:5000/api/v1/auth/config>: harus `"google_enabled": true`.

## Notifikasi WhatsApp

Bawaan `WA_PROVIDER=manual`: sistem menyiapkan pesan, Dosen PA menekan **Kirim WhatsApp** (membuka `wa.me`)
lalu **Tandai terkirim**. Tanpa biaya. Kirim otomatis: isi `WA_PROVIDER=fonnte` + `FONNTE_TOKEN`,
lalu jalankan `python worker.py` (Docker sudah menyertakan worker).

## Masalah umum

| Gejala | Solusi |
|---|---|
| `'flask' is not recognized` / `No module named flask` | venv belum aktif: `venv\Scripts\activate` |
| Halaman login: "Tidak bisa terhubung ke server" | backend belum jalan di port 5000 |
| Tombol Google tidak muncul | `GOOGLE_CLIENT_ID` kosong atau backend belum di-restart |
| Google: "origin not allowed" | origin `http://localhost:3000` belum ditambahkan, atau tunggu ~5 menit |
| Port 5000 dipakai | matikan `python run.py` lain sebelum `docker compose up` |
