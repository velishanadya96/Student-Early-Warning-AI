"use client";

import { Card } from "@/components/ui/Card";
import { useKaprodiDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorChips, KategoriBadge, Loading } from "@/components/risk/RiskParts";
import { num, pct } from "@/lib/dataApi";

export default function KaprodiRisiko() {
  const q = useKaprodiDashboard();
  return (
    <section>
      <div className="mb-6"><p className="text-sm font-semibold text-blue-600">Kaprodi</p><h1 className="text-2xl font-bold">Daftar Risiko Mahasiswa</h1><p className="mt-1 text-sm text-slate-500">Seluruh mahasiswa, risiko tertinggi di atas, dengan penyebabnya.</p></div>
      <Card>
        {q.isLoading && <Loading rows={5} />}
        {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
        {q.data && q.data.mahasiswa.length === 0 && <Empty>Belum ada data.</Empty>}
        {q.data && q.data.mahasiswa.length > 0 && (
          <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="p-3">Mahasiswa</th><th className="p-3">Dosen PA</th><th className="p-3">IPK</th><th className="p-3">Kehadiran</th><th className="p-3">Tugas</th><th className="p-3">Skor</th><th className="p-3">Kategori</th><th className="p-3">Penyebab</th></tr></thead>
            <tbody>{q.data.mahasiswa.map((m) => (
              <tr key={m.nim} className="border-b last:border-0 align-top"><td className="p-3 font-semibold">{m.nama}<div className="text-xs font-normal text-slate-400">{m.nim}</div></td><td className="p-3">{m.dosen_pa ?? <span className="text-slate-400">-</span>}</td>
                <td className="p-3">{num(m.fitur.GPA)}</td><td className="p-3">{pct(m.fitur.attendance_rate)}</td><td className="p-3">{pct(m.fitur.assignment_submission_rate)}</td>
                <td className="p-3 font-bold">{m.skor === null ? "-" : m.skor.toFixed(2)}</td><td className="p-3"><KategoriBadge kategori={m.kategori} /></td><td className="p-3"><FaktorChips faktor={m.faktor} /></td></tr>))}</tbody>
          </table></div>
        )}
      </Card>
    </section>
  );
}
