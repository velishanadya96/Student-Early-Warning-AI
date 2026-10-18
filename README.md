# Student Early Warning AI

Project Front-End Student Early Warning AI berdasarkan SKPL dan kebutuhan praktikum.

## Role
1. Dosen PA
2. Mahasiswa

## Login demo
Semua akun demo memakai password `123456`. Di halaman login tersedia dropdown **Akun demo** untuk mengisi form otomatis.
Belum punya akun? Klik **Daftar** di bawah form login (`/register`).

| Role | Email | Dashboard |
|---|---|---|
| Mahasiswa (Alya Putri, NIM 2024001) — risiko Rendah | `alya@student.uns.ac.id` | `/dashboard-mahasiswa` |
| Mahasiswa (Bagas Pratama, NIM 2024002) — risiko Sedang | `bagas@student.uns.ac.id` | `/dashboard-mahasiswa` |
| Mahasiswa (Citra Lestari, NIM 2024003) — risiko Tinggi | `citra@student.uns.ac.id` | `/dashboard-mahasiswa` |
| Mahasiswa (Dimas Ramadhan, NIM 2024004) — risiko Rendah | `dimas@student.uns.ac.id` | `/dashboard-mahasiswa` |
| Mahasiswa (Eka Sari, NIM 2024005) — risiko Sedang | `eka@student.uns.ac.id` | `/dashboard-mahasiswa` |
| Dosen PA | `dosen@student.uns.ac.id` | `/dashboard` |
| Kaprodi | `kaprodi@student.uns.ac.id` | `/dashboard-kaprodi` |
| Admin | `admin@student.uns.ac.id` | `/dashboard-admin` |
| Orang Tua (pilih mahasiswa di form login) | `orangtua@example.com` | `/dashboard-orangtua` |

## Dashboard Dosen PA
- Ringkasan mahasiswa
- Risiko tinggi/sedang/rendah
- Data mahasiswa
- Risk Score
- Filter risiko
- Catatan tindak lanjut
- Riwayat intervensi

## Dashboard Mahasiswa
- Ringkasan akademik
- IPK
- Presensi
- Aktivitas LMS
- Pengumpulan tugas
- Peringatan dini
- Profil saya
- Status risiko
- Rekomendasi

## Teknologi
Next.js App Router, React 19, TypeScript strict, Tailwind CSS v4, CVA, Zod, Zustand, TanStack Query, Middleware. Semua data diambil dari Flask Backend + database lewat proxy `/api/backend` (tanpa mock data).

## Jalankan
```bash
npm install
npm run dev
```
Buka http://localhost:3000

## Demo Role Dashboard

Project ini sekarang memiliki dashboard multi-role:

- **Dosen PA** → `/dashboard`
- **Mahasiswa** → `/dashboard-mahasiswa`
- **Administrator** → `/dashboard-admin`
- **Kaprodi** → `/dashboard-kaprodi`
- **Orang Tua** → `/dashboard-orangtua`

Password demo: `123456`

Data berasal dari backend (seed dari `backend/contoh/*.csv`). Admin mengunggah CSV/Excel di menu Data, lalu menekan "Hitung risiko"; mahasiswa berisiko Tinggi memicu notifikasi WhatsApp ke orang tua beserta alasan risikonya. Format CSV: lihat `backend/FORMAT_CSV.md` atau template di `public/templates/`.

> Catatan: role Orang Tua merupakan pengembangan tambahan dari SRS yang ada. SRS versi 1.0 mendefinisikan empat aktor utama: Admin, Dosen PA, Kaprodi, dan Mahasiswa.


## Modul 8 — Build Tools Modern

Tugas build-tools dikerjakan sebagai subproject terpisah di `modul-8-vite/` karena aplikasi utama menggunakan Next.js App Router. Subproject tersebut berisi Vite + React + Strict TypeScript + Biome, path alias, manual chunks, HMR demo, CI quality gate, konfigurasi SonarQube, matriks migrasi, dan benchmark PDF.
