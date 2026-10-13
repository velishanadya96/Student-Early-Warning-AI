| Pengujian | Sebelum migrasi: Next.js (ms) | Sesudah: Vite (ms) |
|---|---:|---:|
| Cold start dev server (sampai halaman pertama 200) | 4400 (4211–4469) | 215 (202–221) |
| HMR / edit → versi baru disajikan server | 306 (294–359) | 7 (3–16) |
| Production build | 14692 (14317–15462) | 325 (316–525) |
| Typecheck | 2123 (2122–2138) | 133 (132–137) |
| Lint (ESLint di Next, Biome di Vite) | 1350 (1339–1390) | 53 (51–56) |
