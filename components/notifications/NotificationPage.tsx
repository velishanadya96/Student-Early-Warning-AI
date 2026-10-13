"use client";

import { Bell, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRisksQuery } from "@/hooks/useData";

export default function NotificationPage() {
  const { data: risks, isLoading, isError, refetch } = useRisksQuery();
  // Server hanya mengirim data milik pengguna yang login (mahasiswa: dirinya sendiri; dosen: semua).
  const visible = risks ?? [];
  const high = visible.filter((risk) => risk.category === "Tinggi");

  return <section>
    <div className="mb-6"><p className="text-sm font-semibold text-blue-600">Notifikasi</p><h1 className="text-2xl font-bold">Peringatan Dini</h1><p className="mt-1 text-sm text-slate-500">Notifikasi dibuat berdasarkan hasil risk scoring dan perubahan kondisi akademik.</p></div>
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Card tone="red"><ShieldAlert className="text-red-600"/><p className="mt-3 text-sm text-slate-500">Risiko Tinggi</p><p className="text-3xl font-bold">{high.length}</p></Card><Card><Bell className="text-blue-600"/><p className="mt-3 text-sm text-slate-500">Status Kanal</p><p className="text-xl font-bold">In-App</p></Card><Card><CheckCircle2 className="text-emerald-600"/><p className="mt-3 text-sm text-slate-500">Pemrosesan</p><p className="text-xl font-bold">Aktif</p></Card></div>
    <Card>
      {isLoading && <div className="space-y-3" aria-live="polite">{[1,2,3].map((item) => <div key={item} className="skeleton h-20 rounded-xl" />)}</div>}
      {isError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Notifikasi gagal dimuat. <button type="button" onClick={() => refetch()} className="font-bold underline">Coba lagi</button></div>}
      {!isLoading && !isError && <div className="space-y-3">{visible.length ? visible.map((risk) => <article key={risk.nim} className="flex gap-4 rounded-xl border p-4"><span className="rounded-xl bg-red-50 p-3"><ShieldAlert className="text-red-600" size={20}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">Peringatan Risiko Akademik</p><Badge variant={risk.category === "Tinggi" ? "high" : risk.category === "Sedang" ? "medium" : "low"}>{risk.category}</Badge></div><p className="mt-1 text-sm text-slate-600">{risk.name} memiliki risk score <strong>{risk.score}</strong> dengan faktor dominan {risk.dominantFactor}.</p><p className="mt-2 text-xs text-slate-400">Notifikasi sistem · {new Date(risk.updatedAt).toLocaleDateString("id-ID")}</p></div></article>) : <p className="py-8 text-center text-sm text-slate-500">Belum ada notifikasi risiko.</p>}</div>}
    </Card>
  </section>;
}
