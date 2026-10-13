import { Activity, Gauge, RefreshCw, Zap } from "lucide-react";
import { useState } from "react";

type BuildMetric = {
  tool: string;
  buildTimeMs: number;
  hmrTimeMs: number;
  note: string;
};

const metrics: BuildMetric[] = [
  {
    tool: "Vite + Esbuild",
    buildTimeMs: 280,
    hmrTimeMs: 4,
    note: "Angka contoh dari modul; ukur ulang secara lokal.",
  },
  { tool: "Tailwind v4 Oxide", buildTimeMs: 8, hmrTimeMs: 2, note: "Angka contoh dari modul." },
  { tool: "Rolldown", buildTimeMs: 90, hmrTimeMs: 3, note: "Angka contoh dari modul." },
  {
    tool: "Legacy Webpack",
    buildTimeMs: 14500,
    hmrTimeMs: 850,
    note: "Angka pembanding dari modul.",
  },
];

export default function App() {
  const [renderCount, setRenderCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState("Belum ada interaksi");

  function triggerHmrDemo() {
    setRenderCount((value) => value + 1);
    setLastUpdated(new Date().toLocaleTimeString("id-ID"));
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">MODUL 8 · BUILD TOOLS MODERN</p>
          <h1>Student Early Warning AI</h1>
          <p className="subtitle">
            Vite + Strict TypeScript + Biome Toolchain — studi migrasi build pipeline frontend.
          </p>
        </div>
        <div className="status-pill">
          <Zap size={16} /> Vite ESM
        </div>
      </header>

      <section className="grid three">
        <article className="metric-card">
          <Gauge size={22} />
          <span>Build target</span>
          <strong>ESNext</strong>
        </article>
        <article className="metric-card">
          <Activity size={22} />
          <span>Code splitting</span>
          <strong>vendor + icons</strong>
        </article>
        <article className="metric-card">
          <RefreshCw size={22} />
          <span>HMR demo renders</span>
          <strong>{renderCount}</strong>
        </article>
      </section>

      <section className="panel hmr-panel">
        <div>
          <p className="eyebrow">HMR / INTERACTIVITY</p>
          <h2>Uji interaktivitas development server</h2>
          <p>
            Ubah teks pada App.tsx, simpan, lalu amati pembaruan HMR. Tombol di bawah menguji state
            render.
          </p>
        </div>
        <button type="button" onClick={triggerHmrDemo}>
          Trigger State Render: {renderCount}
        </button>
        <small>Interaksi terakhir: {lastUpdated}</small>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BENCHMARK REFERENCE</p>
            <h2>Toolchain modern</h2>
          </div>
          <span>
            Catatan: angka di bawah adalah referensi modul, bukan hasil benchmark mesin pengguna.
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Toolchain</th>
                <th>Build Time</th>
                <th>HMR</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.tool}>
                  <td>
                    <strong>{metric.tool}</strong>
                  </td>
                  <td>{metric.buildTimeMs} ms</td>
                  <td>{metric.hmrTimeMs} ms</td>
                  <td>{metric.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
