"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useDosenDashboard } from "@/hooks/useData";
import { MahasiswaCards } from "@/components/risk/MahasiswaCards";
import { Empty, ErrorBox, FaktorChips, KategoriBadge, Loading } from "@/components/risk/RiskParts";
import { num, pct } from "@/lib/dataApi";

/** Daftar mahasiswa bimbingan (data berasal dari impor SIAKAD oleh Admin; Dosen PA hanya melihat). */
export default function StudentList() {
  const q = useDosenDashboard();
  const [kata, setKata] = useState("");
  const rows = useMemo(() => (q.data?.mahasiswa ?? []).filter((m) => `${m.nama} ${m.nim}`.toLowerCase().includes(kata.toLowerCase())), [q.data, kata]);

  return (
    <section>
      <div className="mb-6"><h1 className="text-2xl font-bold">Mahasiswa Bimbingan</h1><p className="mt-1 text-sm text-slate-500">Data akademik berasal dari impor Admin (SIAKAD). Untuk mengubah data, minta Admin mengunggah ulang file CSV/Excel.</p></div>
      <Card>
        <div className="relative mb-5 max-w-md"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input aria-label="Cari mahasiswa" value={kata} onChange={(e) => setKata(e.target.value)} placeholder="Cari nama atau NIM..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500" /></div>
        {q.isLoading && <Loading rows={4} />}
        {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
        {q.data && rows.length === 0 && <Empty>Mahasiswa tidak ditemukan.</Empty>}
        {rows.length > 0 && (
          <>
          <MahasiswaCards rows={rows} extra={(m) => <p className="mt-2.5 text-xs text-slate-500">Orang tua: {m.orang_tua ? `${m.orang_tua.nama}${m.orang_tua.no_wa ? ` · +${m.orang_tua.no_wa}` : " (nomor WA belum diisi)"}` : "belum mendaftar"}</p>} />
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="p-3">NIM</th><th className="p-3">Nama</th><th className="p-3">Angkatan</th><th className="p-3">IPK</th><th className="p-3">Kehadiran</th><th className="p-3">Tugas terkumpul</th><th className="p-3">Kategori</th><th className="p-3">Penyebab</th><th className="p-3">Orang tua</th></tr></thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.nim} className="border-b last:border-0 align-top hover:bg-slate-50">
                    <td className="p-3 font-mono">{m.nim}</td><td className="p-3 font-semibold">{m.nama}</td><td className="p-3">{m.angkatan ?? "-"}</td>
                    <td className="p-3">{num(m.ipk)}</td><td className="p-3">{pct(m.fitur.attendance_rate)}</td><td className="p-3">{pct(m.fitur.assignment_submission_rate)}</td>
                    <td className="p-3"><KategoriBadge kategori={m.kategori} /></td><td className="p-3"><FaktorChips faktor={m.faktor} /></td>
                    <td className="p-3 text-xs">{m.orang_tua ? <>{m.orang_tua.nama}<div className="text-slate-400">{m.orang_tua.no_wa ? `+${m.orang_tua.no_wa}` : "Nomor WA belum diisi"}</div></> : <span className="text-slate-400">Belum mendaftar</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>
    </section>
  );
}
