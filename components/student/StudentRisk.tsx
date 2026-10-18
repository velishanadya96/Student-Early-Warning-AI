"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useMahasiswaDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorList, FiturBars, KategoriBadge, Loading, RiwayatList } from "@/components/risk/RiskParts";

export default function StudentRisk() {
  const q = useMahasiswaDashboard();
  if (q.isLoading) return <Loading rows={3} h="h-28" />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return null;
  const { mahasiswa: m, terbaru: t, riwayat } = q.data;
  const tone = t?.kategori === "High" ? "red" : t?.kategori === "Medium" ? "default" : "blue";

  return (
    <section>
      <div className="mb-6"><h1 className="text-2xl font-bold">Status Risiko</h1><p className="mt-1 text-sm text-slate-500">Hasil pemantauan untuk {m.nama} ({m.nim}).</p></div>
      {!t ? <Empty>Skor risiko belum dihitung. Admin perlu mengimpor data akademikmu terlebih dahulu.</Empty> : (
        <>
          <Card tone={tone} className="max-w-3xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm text-slate-500">Skor risiko · periode {t.periode}</p><p className="mt-1 text-5xl font-bold">{t.skor.toFixed(2)}</p></div>
              <KategoriBadge kategori={t.kategori} />
            </div>
          </Card>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card><h2 className="mb-1 font-bold">Penyebab</h2><p className="mb-4 text-sm text-slate-500">Faktor yang paling mendorong skormu.</p><FaktorList faktor={t.faktor} kosong="Tidak ada penyebab yang menonjol. Bagus!" /></Card>
            <Card><h2 className="mb-4 font-bold">Indikator</h2><FiturBars fitur={t.fitur} faktor={t.faktor} /></Card>
          </div>
          <Card className="mt-5"><h2 className="mb-2 font-bold">Riwayat</h2><RiwayatList riwayat={riwayat} /></Card>
          <Card className="mt-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 text-amber-500" /><div><h2 className="font-bold">Cara membaca skor</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Model membandingkan IPK, rata-rata nilai, kehadiran, dan pengumpulan tugasmu dengan pola mahasiswa lain. Kategori tinggi bila skor ≥ 0.40. Ini alat bantu peringatan dini, bukan vonis; diskusikan dengan Dosen PA.</p></div></div></Card>
        </>
      )}
    </section>
  );
}
