# Matriks SRS vs Front-End

| Kode | Kebutuhan | Implementasi |
|---|---|---|
| FR-01 | Login | `app/login`, `LoginForm.tsx`, `app/api/auth/*`, `middleware.ts`, backend `app/auth` |
| FR-02 | Impor Data Akademik | `app/api/students`, impor CSV di `components/admin/AdminData.tsx` |
| FR-03 | Data LMS | Entitas mahasiswa + mock API; impor CSV di `/dashboard-admin/data` |
| FR-04 | Risk Score | Dashboard Dosen + Dashboard Mahasiswa |
| FR-05 | Dashboard Dosen PA | `app/dashboard` |
| FR-06 | Catatan Tindak Lanjut | `app/dashboard/intervensi` |
| FR-10 | Lihat Catatan | `InterventionList.tsx` |
| FR-11 | Notifikasi | Tombol notifikasi + indikator risiko |
| FR-12 | Manajemen Pengguna | `components/admin/AdminUsers.tsx` + backend `app/users` (database) |
| Mahasiswa | Melihat kondisi akademik | `app/dashboard-mahasiswa` |
| Mahasiswa | Melihat status risiko | `app/dashboard-mahasiswa/risiko` |
| Mahasiswa | Melihat rekomendasi | `app/dashboard-mahasiswa/rekomendasi` |
| Tambahan | Verifikasi email, lupa/reset password | `app/verify-email`, `app/forgot-password`, `app/reset-password`, backend `app/auth` |
