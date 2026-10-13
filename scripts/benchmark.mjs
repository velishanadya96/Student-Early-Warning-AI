#!/usr/bin/env node
/**
 * Benchmark Modul 8: pipeline lama (Next.js, root repo) vs Vite (modul-8-vite/).
 *
 * Pakai:  node scripts/benchmark.mjs [--runs=5]
 * Syarat: `npm install` sudah dijalankan di root repo dan di modul-8-vite/.
 *
 * Yang diukur (tiap metrik diulang --runs kali, dilaporkan median/min/maks):
 *  - typecheck        : tsc --noEmit (Next) vs tsc -b (Vite), cache TypeScript dihapus dulu
 *  - lint             : ESLint (Next) vs Biome check (Vite)
 *  - build produksi   : next build vs vite build, folder output dihapus dulu
 *  - cold start dev   : dari proses dijalankan sampai halaman pertama menjawab HTTP 200
 *  - HMR (server)     : dari file disimpan sampai server menyajikan versi barunya
 *                       (BUKAN waktu render di browser; hanya sisi server)
 *
 * Catatan perbandingan: aplikasi Next.js adalah aplikasi penuh (banyak halaman, middleware, API),
 * sedangkan subproject Vite adalah satu halaman demo. Angkanya menggambarkan "pipeline proyek ini
 * sebelum dan sesudah", bukan benchmark murni Webpack vs Vite pada kode yang sama.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vite = path.join(root, "modul-8-vite");
const runs = Number((process.argv.find((a) => a.startsWith("--runs=")) ?? "--runs=5").split("=")[1]);
const isWin = process.platform === "win32";
// Di Windows, .bin berisi shim .cmd yang harus dijalankan lewat shell.
const bin = (dir, name) => path.join(dir, "node_modules", ".bin", isWin ? `${name}.cmd` : name);
const quote = (p) => (isWin ? `"${p}"` : p);

for (const dir of [root, vite]) {
  if (!existsSync(path.join(dir, "node_modules"))) {
    console.error(`node_modules belum ada di ${dir}. Jalankan npm install dulu.`);
    process.exit(1);
  }
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const stats = (xs) => ({ median: Math.round(median(xs)), min: Math.round(Math.min(...xs)), max: Math.round(Math.max(...xs)), runs: xs.length });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function timeCommand(cmd, args, cwd, { before } = {}) {
  const times = [];
  for (let i = 0; i < runs; i++) {
    before?.();
    const t0 = performance.now();
    const res = spawnSync(quote(cmd), args, { cwd, stdio: "ignore", shell: isWin, env: { ...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1" } });
    const dt = performance.now() - t0;
    if (res.status !== 0) throw new Error(`Perintah gagal: ${cmd} ${args.join(" ")} (di ${cwd})`);
    times.push(dt);
  }
  return stats(times);
}

async function waitFor(url, predicate, timeoutMs = 60000) {
  const t0 = performance.now();
  while (performance.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const body = await res.text();
      if (predicate(res, body)) return performance.now() - t0;
    } catch { /* server belum siap */ }
    await sleep(15);
  }
  throw new Error(`Timeout menunggu ${url}`);
}

function startServer(cmd, args, cwd) {
  const child = spawn(quote(cmd), args, { cwd, detached: !isWin, shell: isWin, stdio: "ignore", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", FORCE_COLOR: "0" } });
  return { stop: async () => { try {
      if (isWin) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      else process.kill(-child.pid, "SIGTERM");
    } catch { /* sudah berhenti */ } await sleep(500); } };
}

async function coldStart({ cmd, args, cwd, url }) {
  const times = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    const server = startServer(cmd, args, cwd);
    try { await waitFor(url, (res) => res.status === 200); times.push(performance.now() - t0); } finally { await server.stop(); }
  }
  return stats(times);
}

async function hmr({ cmd, args, cwd, pageUrl, probeUrl, file, find, replaceWith }) {
  const original = readFileSync(file, "utf8");
  if (!original.includes(find)) throw new Error(`Teks "${find}" tidak ditemukan di ${file}`);
  const server = startServer(cmd, args, cwd);
  const times = [];
  try {
    await waitFor(pageUrl, (res) => res.status === 200); // pemanasan: kompilasi pertama
    for (let i = 0; i < runs; i++) {
      const marker = `HMR${i}x${Date.now()}`;
      writeFileSync(file, original.replace(find, replaceWith(marker)));
      const t0 = performance.now();
      await waitFor(probeUrl, (_res, body) => body.includes(marker));
      times.push(performance.now() - t0);
      await sleep(300);
    }
  } finally {
    writeFileSync(file, original);
    await server.stop();
  }
  return stats(times);
}

const cleanNext = () => rmSync(path.join(root, ".next"), { recursive: true, force: true });
const cleanTsNext = () => rmSync(path.join(root, "tsconfig.tsbuildinfo"), { force: true });
const cleanTsVite = () => rmSync(path.join(vite, "node_modules", ".tmp"), { recursive: true, force: true });
const cleanDist = () => rmSync(path.join(vite, "dist"), { recursive: true, force: true });

const version = (dir, pkg) => JSON.parse(readFileSync(path.join(dir, "node_modules", pkg, "package.json"), "utf8")).version;

const results = {
  mesin: {
    tanggal: new Date().toISOString(),
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: `${os.cpus()[0]?.model ?? "?"} x${os.cpus().length}`,
    ramGB: Math.round(os.totalmem() / 2 ** 30),
    node: process.version,
    ulangan: runs,
  },
  versi: {
    next: version(root, "next"), typescriptNext: version(root, "typescript"), eslint: version(root, "eslint"),
    vite: version(vite, "vite"), typescriptVite: version(vite, "typescript"), biome: version(vite, "@biomejs/biome"),
  },
  next: {},
  vite: {},
};

const log = (msg) => console.error(`[benchmark] ${msg}`);

log("typecheck (Next)"); results.next.typecheck = timeCommand(bin(root, "tsc"), ["--noEmit"], root, { before: cleanTsNext });
log("typecheck (Vite)"); results.vite.typecheck = timeCommand(bin(vite, "tsc"), ["-b"], vite, { before: cleanTsVite });
log("lint (ESLint)"); results.next.lint = timeCommand(bin(root, "eslint"), ["."], root);
log("lint (Biome)"); results.vite.lint = timeCommand(bin(vite, "biome"), ["check", "."], vite);
log("build (Next)"); results.next.build = timeCommand(bin(root, "next"), ["build"], root, { before: cleanNext });
log("build (Vite)"); results.vite.build = timeCommand(bin(vite, "vite"), ["build"], vite, { before: cleanDist });
cleanNext(); cleanDist();

log("cold start dev (Next)");
results.next.coldStart = await coldStart({ cmd: bin(root, "next"), args: ["dev", "-p", "3071"], cwd: root, url: "http://127.0.0.1:3071/login" });
cleanNext();
log("cold start dev (Vite)");
results.vite.coldStart = await coldStart({ cmd: bin(vite, "vite"), args: ["--port", "3072", "--host", "127.0.0.1"], cwd: vite, url: "http://127.0.0.1:3072/" });

log("HMR (Next)");
results.next.hmr = await hmr({
  cmd: bin(root, "next"), args: ["dev", "-p", "3071"], cwd: root,
  pageUrl: "http://127.0.0.1:3071/login", probeUrl: "http://127.0.0.1:3071/login",
  file: path.join(root, "components/auth/LoginForm.tsx"),
  find: "Selamat datang kembali", replaceWith: (m) => `Selamat datang kembali ${m}`,
});
cleanNext();
log("HMR (Vite)");
results.vite.hmr = await hmr({
  cmd: bin(vite, "vite"), args: ["--port", "3072", "--host", "127.0.0.1"], cwd: vite,
  pageUrl: "http://127.0.0.1:3072/", probeUrl: "http://127.0.0.1:3072/src/App.tsx",
  file: path.join(vite, "src/App.tsx"),
  find: "<h1>Student Early Warning AI</h1>", replaceWith: (m) => `<h1>Student Early Warning AI ${m}</h1>`,
});

const fmt = (s) => (s ? `${s.median} (${s.min}–${s.max})` : "-");
const rows = [
  ["Cold start dev server (sampai halaman pertama 200)", "coldStart"],
  ["HMR / edit → versi baru disajikan server", "hmr"],
  ["Production build", "build"],
  ["Typecheck", "typecheck"],
  ["Lint (ESLint di Next, Biome di Vite)", "lint"],
];
const md = [
  `| Pengujian | Sebelum migrasi: Next.js (ms) | Sesudah: Vite (ms) |`,
  `|---|---:|---:|`,
  ...rows.map(([label, key]) => `| ${label} | ${fmt(results.next[key])} | ${fmt(results.vite[key])} |`),
].join("\n");

writeFileSync(path.join(vite, "docs", "benchmark-results.json"), JSON.stringify(results, null, 2) + "\n");
writeFileSync(path.join(vite, "docs", "benchmark-results.md"), md + "\n");
console.log(JSON.stringify(results, null, 2));
console.log("\n" + md);
