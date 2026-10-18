"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useDosenDashboard } from "@/hooks/useData";
import InterventionList from "./InterventionList";
import InterventionForm from "./InterventionForm";
import { ErrorBox, Loading } from "@/components/risk/RiskParts";

export default function InterventionPage() {
  const q = useDosenDashboard();
  const [nim, setNim] = useState("");
  const daftar = q.data?.mahasiswa ?? [];
  const aktif = nim || daftar.find((m) => m.kategori === "High")?.nim || daftar[0]?.nim || "";

  return (
    <section>
      <div className="mb-6"><h1 className="text-2xl font-bold">Tindak Lanjut</h1><p className="mt-1 text-sm text-slate-500">Tulis catatan dan rekomendasi untuk mahasiswa bimbingan. Pesan untuk mahasiswa muncul di dashboard dan notifikasinya.</p></div>
      {q.isLoading && <Loading />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Riwayat catatan</h2>
            <InterventionList nim={aktif} />
          </Card>
          <InterventionForm mahasiswa={daftar} nim={aktif} onNim={setNim} />
        </div>
      )}
    </section>
  );
}
