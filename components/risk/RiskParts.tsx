"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BADGE_KATEGORI, LABEL_KATEGORI, type Faktor, type Fitur, type Kategori, type Riwayat } from "@/lib/types";
import { num, pct } from "@/lib/dataApi";

export function KategoriBadge({ kategori }: { kategori: Kategori | null | undefined }) {
  if (!kategori) return <Badge variant="neutral">Belum dihitung</Badge>;
  return <Badge variant={BADGE_KATEGORI[kategori]}>{LABEL_KATEGORI[kategori]}</Badge>;
}

export function Loading({ rows = 3, h = "h-14" }: { rows?: number; h?: string }) {
  return <div className="space-y-3" aria-live="polite">{Array.from({ length: rows }, (_, i) => <div key={i} className={`skeleton ${h} rounded-lg`} />)}</div>;
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Data gagal dimuat.";
  return (
    <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
      {msg} {onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Coba lagi</Button>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</div>;
}

/** Daftar penyebab risiko (kehadiran / IPK / nilai / tugas) dalam kalimat yang mudah dibaca. */
export function FaktorList({ faktor, kosong = "Tidak ada penyebab yang menonjol." }: { faktor: Faktor[]; kosong?: string }) {
  if (!faktor.length) return <p className="text-sm text-slate-500">{kosong}</p>;
  return (
    <ul className="space-y-2">
      {faktor.map((f) => (
        <li key={f.kode} className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />{f.label}
        </li>
      ))}
    </ul>
  );
}

/** Chip penyebab singkat untuk tabel. */
export function FaktorChips({ faktor }: { faktor: Faktor[] }) {
  if (!faktor.length) return <span className="text-slate-400">-</span>;
  return <div className="flex flex-wrap gap-1">{faktor.map((f) => <span key={f.kode} className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{f.singkat}</span>)}</div>;
}

const BAR: { kode: keyof Fitur; label: string; nilai: (v: number) => string; persen: (v: number) => number }[] = [
  { kode: "attendance_rate", label: "Kehadiran", nilai: (v) => pct(v), persen: (v) => v * 100 },
  { kode: "GPA", label: "IPK", nilai: (v) => `${num(v)} / 4.00`, persen: (v) => (v / 4) * 100 },
  { kode: "avg_course_grade", label: "Rata-rata nilai", nilai: (v) => `${num(v, 0)} / 100`, persen: (v) => v },
  { kode: "assignment_submission_rate", label: "Tugas terkumpul", nilai: (v) => pct(v), persen: (v) => v * 100 },
];

export function FiturBars({ fitur, faktor = [] }: { fitur: Partial<Fitur>; faktor?: Faktor[] }) {
  const bermasalah = new Set(faktor.map((f) => f.kode));
  return (
    <div className="space-y-4">
      {BAR.map((b) => {
        const v = fitur[b.kode];
        const merah = bermasalah.has(b.kode);
        return (
          <div key={b.kode}>
            <div className="mb-1 flex justify-between text-sm"><span>{b.label}</span><b className={merah ? "text-red-600" : ""}>{v === null || v === undefined ? "-" : b.nilai(v)}</b></div>
            <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${merah ? "bg-red-500" : "bg-blue-600"}`} style={{ width: `${v === null || v === undefined ? 0 : Math.min(100, Math.max(0, b.persen(v)))}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function RiwayatList({ riwayat }: { riwayat: Riwayat }) {
  if (!riwayat.length) return <p className="text-sm text-slate-500">Belum ada riwayat.</p>;
  return (
    <ul className="divide-y text-sm">
      {[...riwayat].reverse().map((r) => (
        <li key={r.periode} className="flex items-center justify-between py-2"><span>Periode {r.periode}</span><span className="flex items-center gap-3"><span className="text-slate-500">skor {r.skor.toFixed(2)}</span><KategoriBadge kategori={r.kategori} /></span></li>
      ))}
    </ul>
  );
}

export function PeriodeSelect({ value, options, onChange }: { value: string | null; options: string[]; onChange: (p: string | null) => void }) {
  if (options.length < 2) return null;
  return (
    <label className="text-sm font-semibold">Periode{" "}
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className="ml-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal">
        <option value="">Terbaru</option>
        {options.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
    </label>
  );
}

export function Stat({ icon: Icon, label, value, tone = "default", hint }: { icon: typeof AlertTriangle; label: string; value: React.ReactNode; tone?: "default" | "blue" | "red"; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <Icon className="shrink-0 text-slate-400" size={18} aria-hidden="true" />
      </div>
      <p className="mt-3 text-4xl font-extrabold leading-none tracking-tight" style={tone === "red" ? { color: "var(--risk-high)" } : undefined}>{value}</p>
      {hint && <p className="mt-3 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Lingkaran inisial nama; merah bila risiko tinggi. */
export function Avatar({ nama, high = false }: { nama: string; high?: boolean }) {
  const ini = nama.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-extrabold ${high ? "bg-white text-red-600 ring-[1.5px] ring-red-600" : "bg-slate-800 text-white"}`}>{ini}</span>
  );
}

/** Cincin persentase (mis. porsi mahasiswa risiko rendah). */
export function Ring({ persen, size = 96, label }: { persen: number; size?: number; label?: string }) {
  const r = 40, c = 2 * Math.PI * r, v = Math.min(100, Math.max(0, persen));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(v)} persen`}>
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="11" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-extrabold">{Math.round(v)}%</span>
    </div>
  );
}
