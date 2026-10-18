"use client";

import { BookOpen, CheckCircle2, MessageSquare, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useMahasiswaDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorList, FiturBars, KategoriBadge, Loading } from "@/components/risk/RiskParts";
import { LABEL_KATEGORI } from "@/lib/types";
import { num, pct } from "@/lib/dataApi";

export default function StudentDashboard() {
  const q = useMahasiswaDashboard();
  if (q.isLoading) return <Loading rows={3} h="h-28" />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return null;
  const { mahasiswa: m, terbaru: t, pesan_dosen: pesan, dosen_pa } = q.data;
  const tone = t?.kategori === "High" ? "red" : t?.kategori === "Medium" ? "default" : "blue";

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-600">Mahasiswa</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Halo, {m.nama}</h1>
        <p className="mt-1 text-sm text-slate-500">NIM {m.nim}{t ? ` · data periode ${t.periode}` : ""}</p>
      </div>

      {!t ? (
        <Card><div className="py-8 text-center"><ShieldAlert size={42} className="mx-auto text-slate-400" /><h2 className="mt-4 text-lg font-bold">Data akademik belum tersedia</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Akunmu sudah aktif. Status risiko akan muncul setelah Admin mengimpor data nilai, kehadiran, dan tugasmu.</p></div></Card>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card tone={tone}><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Status Risiko</p><p className="mt-2 text-2xl font-bold">{LABEL_KATEGORI[t.kategori]}</p></div><ShieldAlert className="text-red-600" size={30} /></div></Card>
            <Card><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">IPK</p><p className="mt-2 text-2xl font-bold">{num(t.fitur.GPA)}</p></div><BookOpen className="text-blue-600" size={30} /></div></Card>
            <Card><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Kehadiran</p><p className="mt-2 text-2xl font-bold">{pct(t.fitur.attendance_rate)}</p></div><CheckCircle2 className="text-amber-600" size={30} /></div></Card>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card><h2 className="mb-4 text-lg font-bold">Ringkasan Akademik</h2><FiturBars fitur={t.fitur} faktor={t.faktor} /></Card>
            <Card tone={tone}>
              <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Peringatan Dini</h2><KategoriBadge kategori={t.kategori} /></div>
              {t.kategori === "Low" ? <p className="text-sm text-slate-600">Kondisi akademikmu baik. Pertahankan!</p> : <><p className="mb-3 text-sm text-slate-600">Hal yang membuat risikomu naik:</p><FaktorList faktor={t.faktor} /></>}
              {t.catatan_data.length > 0 && <p className="mt-3 text-xs text-slate-400">{t.catatan_data.join(" ")}</p>}
            </Card>
          </div>
        </>
      )}

      <Card className="mt-5">
        <div className="mb-3 flex items-center gap-2"><MessageSquare size={18} className="text-blue-600" /><h2 className="text-lg font-bold">Pesan dari Dosen PA</h2></div>
        {pesan.length === 0 ? <Empty>Belum ada pesan.{dosen_pa ? ` Dosen PA-mu: ${dosen_pa.nama}.` : ""}</Empty> : <ul className="space-y-3">{pesan.map((p, i) => <li key={i} className="rounded-xl bg-blue-50 p-3 text-sm"><span className="text-xs text-slate-400">{p.tanggal}</span><p className="mt-1 text-slate-700">{p.isi}</p></li>)}</ul>}
      </Card>
    </section>
  );
}
