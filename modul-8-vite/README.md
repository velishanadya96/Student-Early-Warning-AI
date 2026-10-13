# Student Early Warning AI — Modul 8 Vite Toolchain

Subproject praktikum untuk memenuhi Modul 8: Build Tools Modern & Bundler Generasi Baru.

## Jalankan

```bash
npm install
npm run dev
```

Dev server menggunakan port `3001` agar tidak bentrok dengan project Next.js (`3000`).

## Quality gate

```bash
npm run typecheck
npm run check
npm run build
```

## Struktur penting

- `vite.config.ts` — alias, dev server, minifikasi Esbuild, manual chunks.
- `biome.json` — formatter + linter Rust-based.
- `tsconfig.app.json` — strict TypeScript + `noUncheckedIndexedAccess`.
- `src/App.tsx` — dashboard benchmarking + HMR/state demo.
- `../.github/workflows/quality.yml` — CI quality gate (harus di root repo agar dijalankan GitHub Actions).
- `sonar-project.properties` — konfigurasi sumber SonarQube.
- `docs/BENCHMARK.md` — hasil pengukuran, batasan, dan cara mengulang (`node scripts/benchmark.mjs` dari root repo).
- `docs/MIGRATION-MATRIX.md` — matriks pemenuhan requirement.

## Catatan versi
Dependency memakai rentang `^` dengan `package-lock.json` yang ikut di-commit (sebelumnya `latest` tanpa lockfile sehingga build bisa rusak sewaktu-waktu). Dengan Vite 8 (Rolldown):
- `manualChunks` ditulis sebagai fungsi, bukan objek.
- `esbuild` harus dipasang terpisah untuk `build.minify: "esbuild"`.
- `baseUrl` dihapus dari `tsconfig.app.json` (dihapus di TypeScript 7); alias cukup lewat `paths`.
