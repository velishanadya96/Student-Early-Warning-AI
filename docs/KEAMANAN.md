# Keamanan

## Alur autentikasi
1. Form login memanggil `POST /api/auth/login` (route Next.js), yang meneruskan kredensial ke backend Flask (`POST /api/v1/auth/login`).
2. Backend memeriksa password dengan **bcrypt**, lalu mengeluarkan JWT: access token 15 menit dan refresh token 7 hari.
3. Route Next.js menyimpan keduanya di cookie **HttpOnly** (`sew_access`, `sew_refresh`; `SameSite=Lax`; `Secure` saat HTTPS). JavaScript di browser tidak bisa membaca token, jadi XSS tidak bisa mencurinya, dan cookie tidak bisa dipalsukan lewat DevTools karena tanda tangannya diverifikasi.
4. `middleware.ts` memverifikasi tanda tangan JWT (HS256, `JWT_SECRET_KEY` sama dengan backend) di setiap halaman dashboard dan `/api/*`. Access token yang habis diperbarui otomatis lewat refresh token.
5. Halaman memulihkan identitas lewat `GET /api/auth/me`, yang juga memeriksa ke backend bahwa akun masih aktif.
6. Logout memanggil backend untuk **mencabut** access dan refresh token (daftar `revoked_token`). Route data Next (`/api/students`, `/api/risks`, `/api/interventions`) memvalidasi sesi ke backend (cache 5 detik), sehingga token yang sudah di-logout atau akunnya dinonaktifkan ditolak paling lambat 5 detik kemudian.

## Kontrol yang berlaku
- Role dalam token menentukan halaman yang boleh dibuka; role yang salah dialihkan ke dashboard miliknya.
- `/api/*` tanpa sesi valid menjawab `401`. Mengubah data mahasiswa hanya Dosen PA dan Admin, menulis tindak lanjut hanya Dosen PA, `/api/users` hanya Admin (`403` selain itu). Backend memeriksa ulang role dan status aktif dari database.
- Data disaring per pengguna di server: Mahasiswa dan Orang Tua hanya menerima data NIM miliknya (Orang Tua: NIM anak yang ditetapkan Admin).
- Permintaan tulis dengan header `Origin` dari situs lain ditolak (pertahanan CSRF tambahan di luar `SameSite`).
- Akun dinonaktifkan Admin: login ditolak, token lama ditolak oleh endpoint ber-RBAC dan `/auth/me`, refresh gagal.
- Pendaftaran mandiri hanya membuat role Mahasiswa; NIM unik; Admin tidak bisa menonaktifkan akunnya sendiri.
- Backend menolak start di production tanpa `JWT_SECRET_KEY` >= 32 karakter; debugger Flask hanya di `APP_ENV=development` pada `127.0.0.1`.
- Rate limit login 10/menit, register 5/menit, refresh 30/menit, email 5/menit per IP klien (dibaca dari `X-Forwarded-For` bila `TRUSTED_PROXIES` diisi); waktu respons login tidak membocorkan apakah akun ada.
- **Penguncian akun:** 5 kali salah password mengunci akun 15 menit (per akun, tidak bisa dihindari dengan ganti IP).
- **Verifikasi email** untuk pendaftaran mandiri, dan **reset password** lewat tautan bertanda tangan sekali pakai (tidak berlaku lagi setelah password diganti). Jawaban "lupa password" dan "kirim ulang" sama untuk email terdaftar maupun tidak.
- Seed menolak password demo `123456` di production.
- Header keamanan: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, dan HSTS di production.

## Batasan yang tersisa
| Batasan | Dampak | Perbaikan |
|---|---|---|
| Rate limit di Docker demo (`docker-compose.yml`) masih memori per proses | Tidak berlaku lintas instance | Compose production sudah memakai Redis |
| `X-Forwarded-For` dipercaya bila `TRUSTED_PROXIES` diisi | Bila frontend terbuka langsung ke internet (compose demo), IP bisa dipalsukan untuk menghindari rate limit per IP (penguncian per akun tetap berlaku) | Compose production menaruh Caddy di depan (menimpa header itu; sudah diuji) |
| Penguncian per akun bisa dipakai untuk mengunci akun orang lain (sengaja menebak password salah) | Korban terkunci 15 menit | CAPTCHA, atau kunci bertahap berdasar IP + akun |
| Validasi sesi di route data di-cache 5 detik | Pencabutan/penonaktifan berlaku paling lambat 5 detik kemudian | Turunkan TTL (lebih banyak beban backend) |
| CSP masih mengizinkan skrip/gaya inline | Mengurangi perlindungan XSS | Nonce per request lewat middleware |
| Data akademik (mahasiswa, risk, tindak lanjut) masih mock di memori server frontend | Hilang saat restart; bukan database | Selesaikan modul backend import/risk/catatan lalu hubungkan |
| Mailpit di compose tidak mengirim email sungguhan | Verifikasi/reset tidak sampai ke kotak surat asli | Isi `MAIL_*` dengan SMTP asli |
| Verifikasi email hanya membuktikan pemilik kotak surat | Tidak membuktikan orang itu mahasiswa UNS | SSO kampus atau pencocokan NIM dengan data SIAKAD |
| `postcss` bawaan `next` 15 rentan (XSS saat stringify CSS tak tepercaya; app tidak memprosesnya) | Risiko rendah di app ini | Naik ke Next 16 (perubahan besar) |
| Tooling dev (`braces` lewat eslint-config-next) rentan ReDoS | Hanya saat pengembangan | Tunggu rilis eslint-config-next |
| Jika `JWT_SECRET_KEY` bocor, token bisa dipalsukan | Seluruh akses terbuka | Simpan sebagai secret, rotasi berkala |
