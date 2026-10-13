"use client";

import { useMemo, useState } from "react";
import { useRisksQuery } from "@/hooks/useData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RiskPage() {
  const { data, isLoading, isError, refetch } = useRisksQuery();
  const [filter, setFilter] = useState<"Semua" | "Rendah" | "Sedang" | "Tinggi">("Semua");
  const filtered = useMemo(() => filter === "Semua" ? (data ?? []) : (data ?? []).filter((x) => x.category === filter), [data, filter]);

  return (
    <section>
      <div className="mb-6"><h1 className="text-2xl font-bold">Risk Score</h1><p className="mt-1 text-sm text-slate-500">Hasil perhitungan risiko berdasarkan IPK, presensi, aktivitas LMS, dan tugas.</p></div>
      <Card>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori risiko">
            {(["Semua", "Rendah", "Sedang", "Tinggi"] as const).map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}
          </div>
          <Button size="sm" variant="secondary" onClick={() => refetch()}>Refresh</Button>
        </div>
        {isLoading && <div className="space-y-3" aria-live="polite">{[1,2,3].map((x) => <div key={x} className="skeleton h-16 rounded-lg" />)}</div>}
        {isError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Gagal memuat risk score. <Button size="sm" variant="secondary" onClick={() => refetch()}>Coba lagi</Button></div>}
        {!isLoading && !isError && filtered.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Tidak ada data pada kategori ini.</div>}
        {!isLoading && !isError && filtered.length > 0 && <div className="space-y-3">{filtered.map((risk) => <article key={risk.nim} className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"><div><h2 className="font-bold">{risk.name}</h2><p className="text-xs text-slate-400">{risk.nim} · Diperbarui {risk.updatedAt}</p><p className="mt-1 text-sm text-slate-500">Faktor dominan: {risk.dominantFactor}</p></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-slate-400">Skor</p><p className="text-2xl font-bold">{risk.score}</p></div><Badge variant={risk.category === "Tinggi" ? "high" : risk.category === "Sedang" ? "medium" : "low"}>{risk.category}</Badge></div></article>)}</div>}
      </Card>
    </section>
  );
}
