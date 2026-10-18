"use client";

import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Hero } from "@/components/ui/Hero";
import { Gauge } from "@/components/ui/Gauge";
import { useOrtuDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorList, KategoriBadge, Loading } from "@/components/risk/RiskParts";
import { LABEL_KATEGORI } from "@/lib/types";
import { num, pct } from "@/lib/dataApi";
import { waLink } from "@/lib/authApi";

export default function ParentDashboard() {
  const q = useOrtuDashboard();
  if (q.isLoading) return <Loading rows={3} h="h-28" />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return null;
  const { mahasiswa: m, terbaru: t, dosen_pa } = q.data;
  const nama = m.nama.split(/\s+/)[0] ?? m.nama;
  const judul = !t ? [nama, "belum ada data."] : t.kategori === "High" ? [`${nama} perlu`, "dampingan."] : t.kategori === "Medium" ? [`${nama} perlu`, "dipantau."] : [`${nama} dalam`, "kondisi baik."];

  return (
    <section className="space-y-4">
      <p className="text-sm font-semibold text-slate-500">Orang tua · {m.nama}</p>
      {!t ? <Empty>Data akademik anak belum tersedia di sistem.</Empty> : (
        <>
          <div className="grid gap-4 lg:grid-cols-12">
            <Hero
              className="lg:col-span-8 lg:row-span-2"
              eyebrow={`NIM ${m.nim} · ${m.prodi ?? "-"} · periode ${t.periode}`}
              title={judul[0] ?? ""}
              accent={judul[1]}
              visualPos="gauge"
              visual={<Gauge skor={t.skor} kategori={t.kategori} />}
            >
              Status risiko: <b>{LABEL_KATEGORI[t.kategori]}</b>.
            </Hero>
            <div className="card p-5 lg:col-span-4"><p className="text-sm font-semibold text-slate-500">IPK</p><p className="mt-3 text-5xl font-extrabold leading-none tracking-tight">{num(t.fitur.GPA)}</p><p className="mt-2 text-xs text-slate-500">dari 4.00</p></div>
            <div className="grid grid-cols-2 gap-4 lg:col-span-4">
              <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Kehadiran</p><p className="mt-3 text-3xl font-extrabold leading-none tracking-tight">{pct(t.fitur.attendance_rate)}</p></div>
              <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Tugas</p><p className="mt-3 text-3xl font-extrabold leading-none tracking-tight">{pct(t.fitur.assignment_submission_rate)}</p></div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <Card tone={t.kategori === "High" ? "red" : "default"} className="lg:col-span-7">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-extrabold">Penyebab</h2><KategoriBadge kategori={t.kategori} /></div>
              {t.kategori === "Low" ? <p className="text-sm text-slate-600">Kondisi akademik anak baik.</p> : <FaktorList faktor={t.faktor} />}
            </Card>
            <Card className="lg:col-span-5">
              <h2 className="text-xl font-extrabold">Dosen PA anak</h2>
              {dosen_pa ? (
                <div className="mt-4 flex items-center gap-4">
                  <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-800 text-sm font-extrabold text-white">{dosen_pa.nama.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>
                  <div className="min-w-0"><p className="font-bold">{dosen_pa.nama}</p>{dosen_pa.no_wa ? <p className="text-sm text-slate-500">WhatsApp +{dosen_pa.no_wa}</p> : <p className="text-sm text-slate-500">Nomor WA belum diisi.</p>}</div>
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">Dosen PA belum ditetapkan.</p>}
              {dosen_pa?.no_wa && <a href={waLink(dosen_pa.no_wa) ?? "#"} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"><MessageCircle size={17} />Chat WhatsApp</a>}
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
