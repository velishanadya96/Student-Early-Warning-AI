"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Hero } from "@/components/ui/Hero";
import { Radar, type RadarLevel } from "@/components/ui/Radar";
import { useKaprodiDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorChips, Loading, PeriodeSelect } from "@/components/risk/RiskParts";

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = total ? `${Math.max((value / total) * 100, value ? 6 : 0)}%` : "0%";
  return <div><div className="mb-1 flex justify-between text-sm"><span>{label}</span><strong>{value}</strong></div><div className="h-3 rounded-full bg-slate-100"><div className={`h-3 rounded-full ${color}`} style={{ width }} /></div></div>;
}

const LEVEL = { High: "high", Medium: "medium", Low: "low" } as const;

export default function KaprodiDashboard({ judul = "Dashboard Program Studi" }: { judul?: string }) {
  const [periode, setPeriode] = useState<string | null>(null);
  const q = useKaprodiDashboard(periode);
  const d = q.data;
  const r = d?.ringkasan;
  const levels: RadarLevel[] = (d?.mahasiswa ?? []).flatMap((m) => (m.kategori ? [LEVEL[m.kategori]] : []));
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">Kaprodi · {judul}</p>
        <PeriodeSelect value={periode} options={d?.periode_tersedia ?? []} onChange={setPeriode} />
      </div>
      {q.isLoading && <Loading rows={3} h="h-40" />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {d && r && (
        <>
          <div className="grid gap-4 lg:grid-cols-12">
            <Hero
              className="lg:col-span-8 lg:row-span-2"
              eyebrow={`${r.total} mahasiswa aktif${d.periode ? ` · periode ${d.periode}` : ""}`}
              title={`${r.High} mahasiswa`}
              accent="berisiko tinggi."
              action={{ href: "/dashboard-kaprodi/laporan", label: "Buka laporan" }}
              visual={<Radar levels={levels} />}
            >
              Pemantauan agregat berdasarkan data impor dan model.{r.belum_dihitung ? ` ${r.belum_dihitung} mahasiswa belum dihitung.` : ""}
            </Hero>
            <Card className="lg:col-span-4">
              <div className="flex items-baseline justify-between"><h2 className="text-lg font-extrabold">Sebaran risiko</h2><span className="text-xs font-semibold text-slate-500">{r.total} mahasiswa</span></div>
              <div className="mt-5 flex h-3.5 gap-[3px] overflow-hidden rounded-full" role="img" aria-label={`Tinggi ${r.High}, sedang ${r.Medium}, rendah ${r.Low}`}>
                <i className="block bg-red-500" style={{ flex: r.High || 0.0001 }} /><i className="block bg-amber-500" style={{ flex: r.Medium || 0.0001 }} /><i className="block bg-emerald-500" style={{ flex: r.Low || 0.0001 }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Tinggi <b className="text-slate-900">{r.High}</b></span><span>Sedang <b className="text-slate-900">{r.Medium}</b></span><span>Rendah <b className="text-slate-900">{r.Low}</b></span>
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-4 lg:col-span-4">
              <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Mahasiswa aktif</p><p className="mt-3 text-5xl font-extrabold leading-none tracking-tight">{r.total}</p></div>
              <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Risiko sedang</p><p className="mt-3 text-5xl font-extrabold leading-none tracking-tight" style={{ color: "var(--risk-med)" }}>{r.Medium}</p></div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-5 text-xl font-extrabold">Distribusi risiko</h2>
              <div className="space-y-4"><Bar label="Rendah" value={r.Low} total={r.total} color="bg-emerald-500" /><Bar label="Sedang" value={r.Medium} total={r.total} color="bg-amber-500" /><Bar label="Tinggi" value={r.High} total={r.total} color="bg-red-500" /></div>
            </Card>
            <Card>
              <h2 className="text-xl font-extrabold">Penyebab risiko tinggi</h2><p className="mb-5 text-sm text-slate-500">Berapa mahasiswa Tinggi yang terpengaruh tiap faktor (satu mahasiswa bisa lebih dari satu).</p>
              {d.penyebab_high.length === 0 ? <Empty>Belum ada mahasiswa risiko tinggi.</Empty> : <div className="space-y-4">{d.penyebab_high.map((p) => <Bar key={p.kode} label={p.nama} value={p.jumlah} total={r.High} color="bg-red-500" />)}</div>}
            </Card>
            <Card>
              <h2 className="mb-4 text-xl font-extrabold">Per angkatan</h2>
              <table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-2">Angkatan</th><th className="p-2">Total</th><th className="p-2">Tinggi</th><th className="p-2">Sedang</th><th className="p-2">Rendah</th></tr></thead>
                <tbody>{d.per_angkatan.map((a) => <tr key={a.angkatan ?? "x"} className="border-b border-slate-100 last:border-0"><td className="p-2 font-semibold">{a.angkatan ?? "-"}</td><td className="p-2">{a.total}</td><td className="p-2 text-red-600">{a.High}</td><td className="p-2 text-amber-600">{a.Medium}</td><td className="p-2 text-emerald-600">{a.Low}</td></tr>)}</tbody></table>
            </Card>
            <Card>
              <h2 className="mb-4 text-xl font-extrabold">Tren per periode</h2>
              <table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-2">Periode</th><th className="p-2">Tinggi</th><th className="p-2">Sedang</th><th className="p-2">Rendah</th></tr></thead>
                <tbody>{d.tren.map((t) => <tr key={t.periode} className="border-b border-slate-100 last:border-0"><td className="p-2 font-semibold">{t.periode}</td><td className="p-2 text-red-600">{t.High}</td><td className="p-2 text-amber-600">{t.Medium}</td><td className="p-2 text-emerald-600">{t.Low}</td></tr>)}</tbody></table>
            </Card>
          </div>
          <Card>
            <div className="mb-4 flex items-start justify-between"><h2 className="text-xl font-extrabold">Mahasiswa risiko tinggi</h2><Link href="/dashboard-kaprodi/risiko" className="text-sm font-bold text-blue-600 underline-offset-4 hover:underline">Lihat semua</Link></div>
            {d.mahasiswa_high.length === 0 ? <Empty>Tidak ada mahasiswa risiko tinggi.</Empty> : <div className="space-y-3">{d.mahasiswa_high.slice(0, 6).map((m) => <div key={m.nim} className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 p-3.5 sm:flex-row sm:items-center"><div><p className="font-semibold">{m.nama}</p><p className="text-xs text-slate-500">{m.nim} · Dosen PA: {m.dosen_pa ?? "-"}</p></div><FaktorChips faktor={m.faktor} /></div>)}</div>}
            <Link href="/dashboard-kaprodi/laporan" className="mt-4 flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold hover:bg-slate-200">Buka laporan <ArrowRight size={16} /></Link>
          </Card>
        </>
      )}
    </section>
  );
}
