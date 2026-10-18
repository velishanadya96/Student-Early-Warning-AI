"use client";

import { useCatatan } from "@/hooks/useData";
import { Empty, ErrorBox, Loading } from "@/components/risk/RiskParts";
import { tanggal } from "@/lib/dataApi";

export default function InterventionList({ nim }: { nim: string }) {
  const { data, isLoading, isError, error } = useCatatan(nim);
  if (!nim) return <Empty>Belum ada mahasiswa bimbingan.</Empty>;
  if (isLoading) return <Loading rows={2} h="h-20" />;
  if (isError) return <ErrorBox error={error} />;
  if (!data?.length) return <Empty>Belum ada catatan untuk {nim}.</Empty>;
  return (
    <div className="space-y-3">
      {data.map((c) => (
        <article key={c.id} className="rounded-xl border p-4">
          <div className="flex justify-between gap-3"><p className="font-bold">{c.nim}{c.periode ? <span className="ml-2 text-xs font-normal text-slate-400">periode {c.periode}</span> : null}</p><time dateTime={c.tanggal} className="text-xs text-slate-400">{tanggal(c.tanggal)}</time></div>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{c.isi_catatan}</p>
          {c.isi_pesan && <p className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-800">Pesan ke mahasiswa: {c.isi_pesan}</p>}
        </article>
      ))}
    </div>
  );
}
