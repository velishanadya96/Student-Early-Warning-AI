"use client";

import { Card } from "@/components/ui/Card";
import { useOrtuDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorList, FiturBars, KategoriBadge, Loading, RiwayatList } from "@/components/risk/RiskParts";

export default function ParentRisk() {
  const q = useOrtuDashboard();
  if (q.isLoading) return <Loading rows={3} h="h-28" />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return null;
  const { mahasiswa: m, terbaru: t, riwayat } = q.data;
  return (
    <section>
      <div className="mb-6"><p className="text-sm font-semibold text-blue-600">Orang tua</p><h1 className="text-2xl font-bold sm:text-3xl">Status Risiko {m.nama}</h1></div>
      {!t ? <Empty>Skor risiko anak belum dihitung.</Empty> : (
        <>
          <Card tone={t.kategori === "High" ? "red" : "blue"} className="mb-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Skor risiko · periode {t.periode}</p><p className="text-4xl font-bold">{t.skor.toFixed(2)}</p></div><KategoriBadge kategori={t.kategori} /></div></Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><h2 className="mb-1 text-lg font-bold">Penyebab</h2><p className="mb-4 text-sm text-slate-500">Faktor yang paling memengaruhi status saat ini.</p><FaktorList faktor={t.faktor} kosong="Tidak ada penyebab yang menonjol." /></Card>
            <Card><h2 className="mb-4 text-lg font-bold">Indikator</h2><FiturBars fitur={t.fitur} faktor={t.faktor} /></Card>
          </div>
          <Card className="mt-6"><h2 className="mb-2 text-lg font-bold">Riwayat</h2><RiwayatList riwayat={riwayat} /></Card>
        </>
      )}
    </section>
  );
}
