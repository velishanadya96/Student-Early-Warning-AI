"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, GraduationCap, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useKaprodiDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorChips, KategoriBadge, Loading, PeriodeSelect, Stat } from "@/components/risk/RiskParts";

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = total ? `${Math.max((value / total) * 100, value ? 6 : 0)}%` : "0%";
  return <div><div className="mb-1 flex justify-between text-sm"><span>{label}</span><strong>{value}</strong></div><div className="h-3 rounded-full bg-slate-100"><div className={`h-3 rounded-full ${color}`} style={{ width }} /></div></div>;
}

export default function KaprodiDashboard({ judul = "Dashboard Program Studi" }: { judul?: string }) {
  const [periode, setPeriode] = useState<string | null>(null);
  const q = useKaprodiDashboard(periode);
  const d = q.data;
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-blue-600">Kaprodi</p><h1 className="text-2xl font-bold sm:text-3xl">{judul}</h1><p className="mt-1 text-sm text-slate-500">Pemantauan agregat risiko mahasiswa berdasarkan data impor dan model.</p></div>
        <PeriodeSelect value={periode} options={d?.periode_tersedia ?? []} onChange={setPeriode} />
      </div>
      {q.isLoading && <Loading rows={3} h="h-28" />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Users} label="Total Mahasiswa" value={d.ringkasan.total} tone="blue" hint={d.ringkasan.belum_dihitung ? `${d.ringkasan.belum_dihitung} belum dihitung` : undefined} />
            <Stat icon={AlertTriangle} label="Risiko Tinggi" value={d.ringkasan.High} tone="red" />
            <Stat icon={GraduationCap} label="Risiko Sedang" value={d.ringkasan.Medium} />
            <Stat icon={CheckCircle2} label="Risiko Rendah" value={d.ringkasan.Low} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-5 text-lg font-bold">Distribusi Risiko</h2>
              <div className="space-y-4"><Bar label="Rendah" value={d.ringkasan.Low} total={d.ringkasan.total} color="bg-emerald-500" /><Bar label="Sedang" value={d.ringkasan.Medium} total={d.ringkasan.total} color="bg-amber-500" /><Bar label="Tinggi" value={d.ringkasan.High} total={d.ringkasan.total} color="bg-red-500" /></div>
            </Card>
            <Card>
              <h2 className="text-lg font-bold">Penyebab Risiko Tinggi</h2><p className="mb-5 text-sm text-slate-500">Berapa mahasiswa Tinggi yang terpengaruh tiap faktor (satu mahasiswa bisa lebih dari satu).</p>
              {d.penyebab_high.length === 0 ? <Empty>Belum ada mahasiswa risiko tinggi.</Empty> : <div className="space-y-4">{d.penyebab_high.map((p) => <Bar key={p.kode} label={p.nama} value={p.jumlah} total={d.ringkasan.High} color="bg-red-500" />)}</div>}
            </Card>
            <Card>
              <h2 className="mb-4 text-lg font-bold">Per Angkatan</h2>
              <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr><th className="p-2">Angkatan</th><th className="p-2">Total</th><th className="p-2">Tinggi</th><th className="p-2">Sedang</th><th className="p-2">Rendah</th></tr></thead>
                <tbody>{d.per_angkatan.map((a) => <tr key={a.angkatan ?? "x"} className="border-b last:border-0"><td className="p-2 font-semibold">{a.angkatan ?? "-"}</td><td className="p-2">{a.total}</td><td className="p-2 text-red-600">{a.High}</td><td className="p-2 text-amber-600">{a.Medium}</td><td className="p-2 text-emerald-600">{a.Low}</td></tr>)}</tbody></table>
            </Card>
            <Card>
              <h2 className="mb-4 text-lg font-bold">Tren per Periode</h2>
              <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr><th className="p-2">Periode</th><th className="p-2">Tinggi</th><th className="p-2">Sedang</th><th className="p-2">Rendah</th></tr></thead>
                <tbody>{d.tren.map((t) => <tr key={t.periode} className="border-b last:border-0"><td className="p-2 font-semibold">{t.periode}</td><td className="p-2 text-red-600">{t.High}</td><td className="p-2 text-amber-600">{t.Medium}</td><td className="p-2 text-emerald-600">{t.Low}</td></tr>)}</tbody></table>
            </Card>
          </div>
          <Card>
            <div className="mb-4 flex items-start justify-between"><div><h2 className="text-lg font-bold">Mahasiswa Risiko Tinggi</h2></div><Link href="/dashboard-kaprodi/risiko" className="text-sm font-semibold text-blue-600">Lihat semua</Link></div>
            {d.mahasiswa_high.length === 0 ? <Empty>Tidak ada mahasiswa risiko tinggi.</Empty> : <div className="space-y-3">{d.mahasiswa_high.slice(0, 6).map((m) => <div key={m.nim} className="flex flex-col justify-between gap-2 rounded-xl border p-3 sm:flex-row sm:items-center"><div><p className="font-semibold">{m.nama}</p><p className="text-xs text-slate-500">{m.nim} · Dosen PA: {m.dosen_pa ?? "-"}</p></div><FaktorChips faktor={m.faktor} /></div>)}</div>}
            <Link href="/dashboard-kaprodi/laporan" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold hover:bg-slate-200">Buka laporan <ArrowRight size={16} /></Link>
          </Card>
        </>
      )}
    </section>
  );
}
