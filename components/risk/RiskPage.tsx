"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useDosenDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorList, FiturBars, KategoriBadge, Loading } from "@/components/risk/RiskParts";
import type { Kategori } from "@/lib/types";

const FILTER: ("Semua" | Kategori)[] = ["Semua", "High", "Medium", "Low"];
const NAMA = { Semua: "Semua", High: "Tinggi", Medium: "Sedang", Low: "Rendah" } as const;

export default function RiskPage() {
  const q = useDosenDashboard();
  const [filter, setFilter] = useState<"Semua" | Kategori>("Semua");
  const rows = useMemo(() => (q.data?.mahasiswa ?? []).filter((m) => m.kategori && (filter === "Semua" || m.kategori === filter)), [q.data, filter]);

  return (
    <section>
      <div className="mb-6"><h1 className="text-2xl font-bold">Risk Score</h1><p className="mt-1 text-sm text-slate-500">Hasil model Random Forest dari IPK, rata-rata nilai, kehadiran, dan pengumpulan tugas, beserta alasannya.</p></div>
      <Card>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori risiko">
            {FILTER.map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{NAMA[f]}</button>)}
          </div>
          <Button size="sm" variant="secondary" onClick={() => q.refetch()}>Refresh</Button>
        </div>
        {q.isLoading && <Loading h="h-24" />}
        {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
        {q.data && rows.length === 0 && <Empty>Tidak ada data pada kategori ini. Skor muncul setelah Admin mengimpor data dan menghitung risiko.</Empty>}
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((m) => (
            <article key={m.nim} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-bold">{m.nama}</h2><p className="text-xs text-slate-400">{m.nim} · periode {m.periode}</p></div>
                <div className="text-right"><p className="text-xs text-slate-400">Peluang risiko tinggi</p><p className="text-xl font-bold">{m.skor === null ? "-" : `${Math.round(m.skor * 100)}%`}</p><KategoriBadge kategori={m.kategori} /></div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-xs font-bold uppercase text-slate-400">Indikator</p><FiturBars fitur={m.fitur} faktor={m.faktor} /></div><div><p className="mb-2 text-xs font-bold uppercase text-slate-400">Penyebab</p><FaktorList faktor={m.faktor} kosong="Tidak ada penyebab menonjol." /></div></div>
            </article>
          ))}
        </div>
      </Card>
    </section>
  );
}
