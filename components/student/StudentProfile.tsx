"use client";

import { Card } from "@/components/ui/Card";
import { useMahasiswaDashboard } from "@/hooks/useData";
import { ErrorBox, Loading } from "@/components/risk/RiskParts";
import { num } from "@/lib/dataApi";

export default function StudentProfile() {
  const q = useMahasiswaDashboard();
  const d = q.data;
  const fields: [string, string][] = d ? [
    ["NIM", d.mahasiswa.nim], ["Nama", d.mahasiswa.nama], ["Program Studi", d.mahasiswa.prodi ?? "-"],
    ["Angkatan", d.mahasiswa.angkatan ? String(d.mahasiswa.angkatan) : "-"], ["IPK", d.mahasiswa.ipk === null ? "-" : num(d.mahasiswa.ipk)],
    ["Dosen PA", d.dosen_pa ? d.dosen_pa.nama : "Belum ditentukan"],
  ] : [];
  return (
    <section>
      <div className="mb-6"><h1 className="text-2xl font-bold">Profil Saya</h1><p className="mt-1 text-sm text-slate-500">Data dari SIAKAD yang tersimpan di sistem.</p></div>
      <Card className="max-w-2xl">
        {q.isLoading && <Loading rows={2} />}
        {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
        {d && <div className="grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div>}
      </Card>
    </section>
  );
}
