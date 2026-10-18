"use client";

import { MessageSquare, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Hero } from "@/components/ui/Hero";
import { Gauge } from "@/components/ui/Gauge";
import { useMahasiswaDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorList, FiturBars, KategoriBadge, Loading } from "@/components/risk/RiskParts";
import { LABEL_KATEGORI } from "@/lib/types";
import { num, pct, tanggal } from "@/lib/dataApi";

const JUDUL = {
  High: ["Kamu perlu", "dampingan."],
  Medium: ["Kondisimu perlu", "dipantau."],
  Low: ["Kondisimu", "baik."],
} as const;

export default function StudentDashboard() {
  const q = useMahasiswaDashboard();
  if (q.isLoading) return <Loading rows={3} h="h-28" />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return null;
  const { mahasiswa: m, terbaru: t, pesan_dosen: pesan, dosen_pa } = q.data;

  return (
    <section className="space-y-4">
      <p className="text-sm font-semibold text-slate-500">Mahasiswa · Halo, {m.nama}</p>

      {!t ? (
        <Card><div className="py-8 text-center"><ShieldAlert size={42} className="mx-auto text-slate-400" /><h2 className="mt-4 text-lg font-bold">Data akademik belum tersedia</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Akunmu sudah aktif. Status risiko akan muncul setelah Admin mengimpor data nilai, kehadiran, dan tugasmu.</p></div></Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-12">
            <Hero
              className="lg:col-span-8 lg:row-span-2"
              eyebrow={`NIM ${m.nim} · periode ${t.periode}`}
              title={JUDUL[t.kategori][0]}
              accent={JUDUL[t.kategori][1]}
              visualPos="gauge"
              visual={<Gauge skor={t.skor} kategori={t.kategori} />}
            >
              Status risiko: <b>{LABEL_KATEGORI[t.kategori]}</b>. {t.kategori === "Low" ? "Pertahankan!" : "Lihat penyebabnya di bawah."}
            </Hero>
            <div className="card p-5 lg:col-span-4">
              <p className="text-sm font-semibold text-slate-500">IPK</p>
              <p className="mt-3 text-5xl font-extrabold leading-none tracking-tight">{num(t.fitur.GPA)}</p>
              <p className="mt-2 text-xs text-slate-500">dari 4.00</p>
            </div>
            <div className="card p-5 lg:col-span-4">
              <p className="text-sm font-semibold text-slate-500">Kehadiran</p>
              <p className="mt-3 text-5xl font-extrabold leading-none tracking-tight" style={t.faktor.some((f) => f.kode === "attendance_rate") ? { color: "var(--risk-high)" } : undefined}>{pct(t.fitur.attendance_rate)}</p>
              <p className="mt-2 text-xs text-slate-500">batas aman 75%</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card><h2 className="mb-4 text-xl font-extrabold">Ringkasan akademik</h2><FiturBars fitur={t.fitur} faktor={t.faktor} /></Card>
            <Card tone={t.kategori === "High" ? "red" : "default"}>
              <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">Peringatan dini</h2><KategoriBadge kategori={t.kategori} /></div>
              {t.kategori === "Low" ? <p className="text-sm text-slate-600">Kondisi akademikmu baik. Pertahankan!</p> : <><p className="mb-3 text-sm text-slate-600">Hal yang membuat risikomu naik:</p><FaktorList faktor={t.faktor} /></>}
              {t.catatan_data.length > 0 && <p className="mt-3 text-xs text-slate-400">{t.catatan_data.join(" ")}</p>}
            </Card>
          </div>
        </>
      )}

      <Card>
        <div className="mb-3 flex items-center gap-2"><MessageSquare size={18} className="text-blue-600" /><h2 className="text-xl font-extrabold">Pesan dari Dosen PA</h2></div>
        {pesan.length === 0 ? <Empty>Belum ada pesan.{dosen_pa ? ` Dosen PA-mu: ${dosen_pa.nama}.` : ""}</Empty> : <ul className="space-y-3">{pesan.map((p, i) => <li key={i} className="rounded-2xl bg-slate-50 p-4 text-sm"><span className="text-xs text-slate-400">{tanggal(p.tanggal)}</span><p className="mt-1 text-slate-700">{p.isi}</p></li>)}</ul>}
      </Card>
    </section>
  );
}
