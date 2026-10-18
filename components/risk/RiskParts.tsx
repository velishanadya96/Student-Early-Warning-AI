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
  return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">{children}</div>;
}

/** Daftar penyebab risiko (kehadiran / IPK / nilai / tugas) dalam kalimat yang mudah dibaca. */
export function FaktorList({ faktor, kosong = "Tidak ada indikator yang menonjol." }: { faktor: Faktor[]; kosong?: string }) {
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
  const color = tone === "red" ? "text-red-600" : "text-blue-600";
  const bg = tone === "red" ? "border-red-100 bg-red-50/40" : tone === "blue" ? "border-blue-100 bg-blue-50/40" : "";
  return (
    <div className={`card p-5 ${bg}`}>
      <div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div><Icon className={color} size={28} /></div>
      {hint && <p className="mt-3 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
