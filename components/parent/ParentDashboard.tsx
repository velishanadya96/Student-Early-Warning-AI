"use client";

import { AlertTriangle, CheckCircle2, ClipboardCheck, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useOrtuDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorList, KategoriBadge, Loading, Stat } from "@/components/risk/RiskParts";
import { LABEL_KATEGORI } from "@/lib/types";
import { num, pct } from "@/lib/dataApi";

export default function ParentDashboard() {
  const q = useOrtuDashboard();
  if (q.isLoading) return <Loading rows={3} h="h-28" />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return null;
  const { mahasiswa: m, terbaru: t, dosen_pa } = q.data;
  return (
    <section className="space-y-6">
      <div><p className="text-sm font-semibold text-blue-600">Orang Tua</p><h1 className="text-2xl font-bold sm:text-3xl">Perkembangan Akademik {m.nama}</h1><p className="mt-1 text-sm text-slate-500">NIM {m.nim} · {m.prodi ?? "-"}{t ? ` · periode ${t.periode}` : ""}</p></div>
      {!t ? <Empty>Data akademik ananda belum tersedia di sistem.</Empty> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={AlertTriangle} label="Status Risiko" value={LABEL_KATEGORI[t.kategori]} tone={t.kategori === "High" ? "red" : "blue"} />
            <Stat icon={GraduationCap} label="IPK" value={num(t.fitur.GPA)} />
            <Stat icon={CheckCircle2} label="Kehadiran" value={pct(t.fitur.attendance_rate)} />
            <Stat icon={ClipboardCheck} label="Tugas terkumpul" value={pct(t.fitur.assignment_submission_rate)} />
          </div>
          <Card tone={t.kategori === "High" ? "red" : "default"}>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Penyebab</h2><KategoriBadge kategori={t.kategori} /></div>
            {t.kategori === "Low" ? <p className="text-sm text-slate-600">Kondisi akademik ananda baik.</p> : <FaktorList faktor={t.faktor} />}
            {dosen_pa && <p className="mt-4 text-sm text-slate-600">Dosen PA ananda: <b>{dosen_pa.nama}</b>{dosen_pa.no_wa ? ` (WhatsApp +${dosen_pa.no_wa})` : ""}. Silakan hubungi bila perlu.</p>}
          </Card>
        </>
      )}
    </section>
  );
}
