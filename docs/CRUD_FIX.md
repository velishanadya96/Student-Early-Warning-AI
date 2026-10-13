# CRUD Data Mahasiswa

Halaman `/dashboard/mahasiswa` sekarang mendukung:
- Tambah mahasiswa
- Edit mahasiswa
- Hapus mahasiswa dengan konfirmasi
- Cari berdasarkan nama/NIM
- Filter berdasarkan kategori risiko
- Validasi Zod pada input
- TanStack Query mutation + invalidate query
- Risk Score otomatis dihitung ulang setelah data mahasiswa berubah

Data menggunakan mock in-memory API untuk kebutuhan praktikum (`lib/mockDb.ts`, disimpan di `globalThis` agar semua route handler memakai data yang sama). Data akan kembali ke data awal setelah server direstart.

Endpoint tulis (`POST/PUT/DELETE /api/students`) hanya menerima role Dosen PA dan Admin, dan `GET` hanya mengembalikan data yang boleh dilihat peran tersebut. Admin juga bisa menambah/memperbarui banyak mahasiswa sekaligus lewat impor CSV.
