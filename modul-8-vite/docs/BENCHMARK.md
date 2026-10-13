# Benchmark Modul 8, Student Early Warning AI

## Tujuan
Membandingkan pipeline build proyek sebelum migrasi (aplikasi Next.js di root repo) dengan sesudah migrasi (subproject Vite + Biome di `modul-8-vite/`): cold start dev server, kecepatan reload saat file diubah, production build, typecheck, dan lint.

## Hasil pengukuran

Diukur dengan skrip [`scripts/benchmark.mjs`](../../scripts/benchmark.mjs), **5 ulangan per metrik**, nilai = median ms (min–maks).

**Mesin:** Apple M4 (10 core), RAM 16 GB, macOS (Darwin 25.6.0 arm64), Node v26.1.0. **Tanggal:** 13 Oktober 2026.
**Versi:** Next 15.5.25 + TypeScript 5.9.3 + ESLint 9.39.5 (sebelum); Vite 8.3.4 + TypeScript 7.0.2 + Biome 1.9.4 (sesudah).

| Pengujian | Sebelum migrasi: Next.js (ms) | Sesudah: Vite (ms) |
|---|---:|---:|
| Cold start dev server (sampai halaman pertama menjawab 200) | 4400 (4211–4469) | 215 (202–221) |
| HMR / edit file sampai versi baru disajikan server | 306 (294–359) | 7 (3–16) |
| Production build (folder output dihapus dulu) | 14692 (14317–15462) | 325 (316–525) |
| Typecheck (cache TypeScript dihapus dulu) | 2123 (2122–2138) | 133 (132–137) |
| Lint (ESLint di Next, Biome di Vite) | 1350 (1339–1390) | 53 (51–56) |

Data mentah: [`benchmark-results.json`](benchmark-results.json).

## Cara membaca angka ini (batasan yang jujur)
- **Bukan perbandingan murni Webpack vs Vite.** Sisi "sebelum" adalah aplikasi penuh (26 halaman, middleware, API, dua dependency besar), sedangkan sisi "sesudah" adalah satu halaman demo. Selisih besar sebagian besar karena ukuran proyeknya berbeda, bukan hanya karena bundler.
- **Versi TypeScript berbeda.** Subproject Vite memakai TypeScript 7 (compiler native, jauh lebih cepat) sedangkan aplikasi utama TypeScript 5.9. Angka typecheck terutama menunjukkan perbedaan itu.
- **HMR diukur di sisi server**: dari file disimpan sampai server mampu menyajikan versi barunya (Next: halaman `/login` diminta ulang; Vite: modul `/src/App.tsx` diminta ulang). Ini bukan waktu sampai tampilan di browser berubah.
- **Cold start** dihitung dari proses dijalankan sampai halaman pertama menjawab HTTP 200 (Next sudah termasuk kompilasi halaman `/login`).
- Angka di dashboard demo (`src/App.tsx`) bertanda "angka contoh dari modul" adalah referensi, **bukan** hasil di atas.

## Cara mengulang di laptop sendiri
Angka di atas diukur di satu mesin. Untuk laporan, ulangi di laptop masing-masing (hasilnya akan berbeda):

```bash
npm install                      # di root repo
npm install --prefix modul-8-vite
node scripts/benchmark.mjs --runs=5
```
Skrip menulis `docs/benchmark-results.json` dan `docs/benchmark-results.md`, lalu mencetak tabel ke terminal (screenshot terminal ini bisa dipakai sebagai bukti). Jalankan saat laptop tidak sedang mengerjakan hal berat lain, dan tutup server dev (`npm run dev`) lebih dulu karena skrip memakai port 3071 dan 3072.
