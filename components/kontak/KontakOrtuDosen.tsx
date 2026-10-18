"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { kontakOrtuApi, waLink } from "@/lib/authApi";

/** Dashboard Dosen PA: kontak WhatsApp orang tua mahasiswa bimbingan (GET /api/kontak/ortu). */
export default function KontakOrtuDosen() {
  const kontak = useQuery({ queryKey: ["kontak", "ortu"], queryFn: kontakOrtuApi, staleTime: 30_000 });

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">Dosen PA</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Kontak WhatsApp Orang Tua</h1>
        <p className="mt-1 text-sm text-slate-500">Orang tua dari mahasiswa bimbingan Anda.</p>
      </div>
      <Card>
        {kontak.isLoading && <div className="space-y-3" aria-live="polite">{[1, 2, 3].map((x) => <div key={x} className="skeleton h-12 rounded-lg" />)}</div>}
        {kontak.isError && (
          <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {kontak.error instanceof Error ? kontak.error.message : "Gagal memuat data kontak."}{" "}
            <Button size="sm" variant="secondary" onClick={() => kontak.refetch()}>Coba lagi</Button>
          </div>
        )}
        {kontak.data?.length === 0 && <p className="text-sm text-slate-500">Belum ada mahasiswa bimbingan.</p>}
        {kontak.data && kontak.data.length > 0 && (
          <>
          <ul className="space-y-3 md:hidden">
            {kontak.data.map((row) => {
              const link = waLink(row.no_wa_orang_tua, `Assalamualaikum, saya Dosen PA dari ${row.nama_mahasiswa}.`);
              return (
                <li key={row.nim} className="row-card !items-start">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{row.nama_mahasiswa}</span>
                    <span className="block text-xs tabular-nums text-slate-500">NIM {row.nim}</span>
                    <span className="mt-2 block text-sm">{row.orang_tua ?? <span className="text-slate-400">Belum ada akun orang tua</span>}</span>
                    {row.no_wa_orang_tua && <span className="block text-xs tabular-nums text-slate-500">+{row.no_wa_orang_tua}</span>}
                  </span>
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><MessageCircle size={14} />Chat WA</a>}
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr><th className="p-3">NIM</th><th className="p-3">Mahasiswa</th><th className="p-3">Orang Tua</th><th className="p-3">No WhatsApp</th><th className="p-3"><span className="sr-only">Aksi</span></th></tr>
              </thead>
              <tbody>
                {kontak.data.map((row) => {
                  const link = waLink(row.no_wa_orang_tua, `Assalamualaikum, saya Dosen PA dari ${row.nama_mahasiswa}.`);
                  return (
                    <tr key={row.nim} className="border-b last:border-0">
                      <td className="p-3 font-mono">{row.nim}</td>
                      <td className="p-3 font-semibold">{row.nama_mahasiswa}</td>
                      <td className="p-3">{row.orang_tua ?? <span className="text-slate-400">Belum ada akun</span>}</td>
                      <td className="p-3">{row.no_wa_orang_tua ? `+${row.no_wa_orang_tua}` : "-"}</td>
                      <td className="p-3">
                        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"><MessageCircle size={14} />Chat WA</a>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>
    </section>
  );
}
