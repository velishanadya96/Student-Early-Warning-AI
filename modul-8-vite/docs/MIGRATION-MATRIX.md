# Matriks Migrasi Build Pipeline

| Requirement Modul 8 | Implementasi | Bukti |
|---|---|---|
| Vite + React + TypeScript | `package.json`, `vite.config.ts`, `src/` | Project Vite |
| Path alias `@/` | `vite.config.ts` + `tsconfig.app.json` | Alias source |
| Strict TypeScript | `strict: true` | `tsconfig.app.json` |
| `noUncheckedIndexedAccess` | Diaktifkan | `tsconfig.app.json` |
| Biome | `biome.json`, `npm run check` | Quality script |
| Code splitting | `manualChunks.vendor` + `manualChunks.icons` | `vite.config.ts` |
| Esbuild minification | `minify: "esbuild"` | `vite.config.ts` |
| HMR | Interactive counter + documented measurement procedure | `src/App.tsx`, `docs/BENCHMARK.md` |
| CI/CD quality gate | GitHub Actions: typecheck → Biome → build | `.github/workflows/quality.yml` (root repo, job `vite`) |
| SonarQube | `sonar-project.properties` | Static analysis configuration |
| Benchmark | Skrip pengukuran + hasil terukur + PDF ringkas | `../scripts/benchmark.mjs`, `docs/BENCHMARK.md`, `Modul-8-Migrasi-Benchmark.pdf` |

## Catatan
Angka benchmark di `docs/BENCHMARK.md` diukur dengan `scripts/benchmark.mjs` pada satu mesin (spesifikasi tercantum di sana) dan perlu diulang di perangkat masing-masing untuk laporan. Angka di dashboard demo adalah referensi modul, bukan hasil pengukuran.
