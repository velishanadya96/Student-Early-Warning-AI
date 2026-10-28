# Student Early Warning AI (SEW-AI)

Sistem peringatan dini mahasiswa berisiko akademik. Model machine learning menghitung risiko
(Rendah/Sedang/Tinggi) dari 4 fitur: IPK, rata-rata nilai mata kuliah, persentase kehadiran,
dan persentase pengumpulan tugas. Mahasiswa berisiko Tinggi memicu notifikasi WhatsApp ke orang tua
beserta alasan risikonya.

## Struktur repo

| Branch | Isi |
|---|---|
| `master` / `frontend-integrasi` | Front-end Next.js (repo ini) |
| `backend` | Back-end Flask + database + model ML |
| `mobile` | Aplikasi mobile |

Cara menjalankan semuanya di localhost: lihat **[CARA-PASANG.md](CARA-PASANG.md)**.

## Peran (5)

| Peran | Dashboard | Fitur utama |
|---|---|---|
| Dosen PA | `/dashboard` | Ringkasan bimbingan, daftar risiko, detail mahasiswa, catatan tindak lanjut, riwayat intervensi, pesan WA ke orang tua, kontak orang tua, laporan |
| Mahasiswa | `/dashboard-mahasiswa` | Ringkasan akademik, status risiko + penyebab, rekomendasi, pesan dari Dosen PA, notifikasi, profil |
| Kaprodi | `/dashboard-kaprodi` | Ringkasan risiko prodi, daftar risiko, unduh laporan PDF/Excel |
| Admin | `/dashboard-admin` | Impor data akademik & tugas (CSV/Excel), hitung risiko, kelola pengguna, roster NIM |
| Orang Tua | `/dashboard-orangtua` | Status risiko anak, IPK anak, notifikasi, kontak WA Dosen PA |

> Peran Orang Tua adalah pengembangan tambahan dari SRS v1.0 (yang mendefinisikan Admin, Dosen PA, Kaprodi, Mahasiswa).

## Login

- **Email + password**, atau **Masuk dengan Google** (akun harus sudah terdaftar).
- **Daftar mahasiswa** (`/register`): wajib akun Google asli + NIM, kalau `GOOGLE_CLIENT_ID` diisi di backend.
  Kalau kosong, daftar memakai email + tautan verifikasi.
- **Orang tua** (`/login-ortu`): NIM anak + email anak + password orang tua. Daftar di `/register-ortu`.

## Akun demo

Password semua akun: `123456`.

| Peran | Email |
|---|---|
| Admin | `admin@student.uns.ac.id` |
| Kaprodi | `kaprodi@student.uns.ac.id` |
| Dosen PA | `dosen@student.uns.ac.id` |
| Mahasiswa | `alya@`, `bagas@`, `citra@`, `dimas@`, `eka@` + `student.uns.ac.id` (NIM 2024001 s/d 2024005) |
| Orang Tua | login di `/login-ortu`: NIM `2024001` + `alya@student.uns.ac.id` (akun `orangtua@example.com`) |

## Teknologi

Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4, CVA, Zod, Zustand, TanStack Query.
Semua data diambil dari backend Flask lewat proxy `/api/backend` (tanpa data tiruan). Token disimpan di
cookie httpOnly, dan `middleware.ts` memeriksa peran ke server sebelum membuka dashboard.

Format file impor ada di `FORMAT_CSV.md` pada branch `backend`; template CSV ada di `public/templates/`.

## Modul 8 (Build Tools Modern)

Dikerjakan sebagai subproject terpisah di `modul-8-vite/` (Vite + React + Strict TypeScript + Biome).
