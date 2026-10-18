# Format file impor (CSV atau Excel .xlsx)

Diunggah Admin di **Dashboard Admin > Data Akademik**, lalu klik **Hitung risiko**.
Urutan: (1) data akademik, (2) data tugas, (3) hitung risiko. Maksimal 5 MB / 20.000 baris per file.
Nama kolom tidak peka huruf besar/kecil. Pemisah koma `,` atau titik-koma `;` (otomatis dikenali). Encoding UTF-8.

Aturan umum: **semua-atau-tidak-sama-sekali**. Jika ada satu baris salah, tidak ada yang disimpan dan sistem
menampilkan daftar kesalahan (nomor baris, kolom, pesan) supaya bisa diperbaiki sekaligus.
Mengunggah ulang file untuk periode yang sama **menimpa** data lama (tidak menggandakan).

## Periode
`TAHUN-1` = semester ganjil (Agustus-Januari), `TAHUN-2` = genap (Februari-Juli). Contoh `2026-1`.
Dipilih di halaman unggah, bukan di dalam file.

## 1. Data akademik (nilai + kehadiran)  -> `contoh/akademik_2026-1.csv`
Satu baris = satu mahasiswa x satu mata kuliah.

| Kolom | Wajib | Isi |
|---|---|---|
| `nim` | ya | huruf/angka, maks. 20 karakter |
| `kode_mk` | ya | kode mata kuliah, maks. 20 karakter |
| `nilai_mk` | ya | 0-100 |
| `total_pertemuan` | ya | bilangan bulat 1-60 (jumlah pertemuan yang sudah berlangsung) |
| `hadir` | ya | bilangan bulat 0-total_pertemuan |
| `nama` | wajib bila NIM belum ada | nama mahasiswa |
| `prodi`, `angkatan` | tidak | angkatan = tahun 4 digit |
| `ipk` | tidak | 0-4, pakai titik (3.25). Jika kosong, diperkirakan dari rata-rata nilai |
| `nidn_dosen_pa` | tidak | NIDN Dosen PA (harus sudah terdaftar). Menentukan siapa yang melihat mahasiswa ini |

Fitur model dihitung per periode: `attendance_rate` = jumlah hadir / jumlah pertemuan semua MK;
`avg_course_grade` = rata-rata `nilai_mk`; `GPA` = `ipk`.

## 2. Data tugas  -> `contoh/tugas_2026-1.csv`
Satu baris = satu tugas. NIM harus sudah ada (unggah data akademik dulu).

| Kolom | Wajib | Isi |
|---|---|---|
| `nim` | ya | |
| `kode_mk` | ya | |
| `judul` | tidak | maks. 150 karakter |
| `waktu_kumpul` | tidak | `2026-09-30` atau `2026-09-30 14:30` atau `30/09/2026`. **Kosong = belum dikumpulkan** |
| `status_terlambat` | tidak | `tepat` / `terlambat` |

`assignment_submission_rate` = tugas yang punya `waktu_kumpul` / seluruh tugas.

## Notifikasi WhatsApp ke orang tua
Saat hitung risiko, mahasiswa yang **baru** masuk kategori High memicu:
- notifikasi dashboard untuk mahasiswa, Dosen PA, dan orang tua;
- pesan WhatsApp ke nomor orang tua (jika orang tua sudah mendaftar dan mengisi no WA) berisi **penyebab**:
  kehadiran rendah / IPK rendah / rata-rata nilai rendah / tugas kurang terkumpul.
Menghitung ulang tidak mengirim pesan dobel. Mode pengiriman diatur `WA_PROVIDER` di `.env`
(`manual` = Dosen PA menekan tombol Kirim WhatsApp; `fonnte` = otomatis; `log` = uji coba).
