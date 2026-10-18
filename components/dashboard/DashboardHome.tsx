"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, GraduationCap, MessageCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useDosenDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, FaktorChips, KategoriBadge, Loading, PeriodeSelect, Stat } from "@/components/risk/RiskParts";

const waStatus = { pending: ["Menunggu dikirim", "medium"], terkirim: ["Terkirim", "low"], gagal: ["Gagal", "high"] } as const;

export default function DashboardHome() {
  const [periode, setPeriode] = useState<string | null>(null);
  const q = useDosenDashboard(periode);
  const d = q.data;

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Dosen PA</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard Risiko Akademik</h1>
          <p className="mt-1 text-sm text-slate-500">Mahasiswa bimbingan Anda, diurutkan dari risiko tertinggi, lengkap dengan penyebabnya.</p>
        </div>
        <div className="flex items-center gap-3">
          {d?.periode && <Badge variant="neutral">Periode {d.periode}</Badge>}
          <PeriodeSelect value={periode} options={d?.periode_tersedia ?? []} onChange={setPeriode} />
        </div>
      </div>

      {q.isLoading && <Loading rows={4} h="h-24" />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {d && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} label="Mahasiswa bimbingan" value={d.ringkasan.total} tone="blue" />
            <Stat icon={AlertTriangle} label="Risiko Tinggi" value={d.ringkasan.High} tone="red" hint={d.wa_menunggu ? `${d.wa_menunggu} pesan WA ke orang tua menunggu dikirim` : undefined} />
            <Stat icon={GraduationCap} label="Risiko Sedang" value={d.ringkasan.Medium} />
            <Stat icon={CheckCircle2} label="Risiko Rendah" value={d.ringkasan.Low} />
          </div>

          {d.wa_menunggu > 0 && (
            <Link href="/dashboard/notifikasi" className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
              <MessageCircle size={20} /> {d.wa_menunggu} pesan peringatan ke WhatsApp orang tua siap dikirim. Buka dan kirim sekarang →
            </Link>
          )}

          <Card>
            <div className="mb-4"><h2 className="text-lg font-bold">Mahasiswa yang Perlu Perhatian</h2><p className="text-sm text-slate-500">Penyebab diambil dari model: kehadiran, IPK, rata-rata nilai, atau pengumpulan tugas.</p></div>
            {d.mahasiswa.length === 0 ? <Empty>Belum ada mahasiswa bimbingan. Admin perlu mengimpor data dan menetapkan Dosen PA.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="p-3">Mahasiswa</th><th className="p-3">Skor</th><th className="p-3">Kategori</th><th className="p-3">Penyebab</th><th className="p-3">WA Orang Tua</th></tr></thead>
                  <tbody>
                    {d.mahasiswa.map((m) => (
                      <tr key={m.nim} className="border-b last:border-0 align-top">
                        <td className="p-3 font-semibold">{m.nama}<div className="text-xs font-normal text-slate-400">{m.nim}</div></td>
                        <td className="p-3 font-bold">{m.skor === null ? "-" : m.skor.toFixed(2)}</td>
                        <td className="p-3"><KategoriBadge kategori={m.kategori} /></td>
                        <td className="p-3"><FaktorChips faktor={m.faktor} /></td>
                        <td className="p-3">{m.kategori !== "High" ? <span className="text-slate-400">-</span> : m.wa ? <Badge variant={waStatus[m.wa.status][1]}>{waStatus[m.wa.status][0]}</Badge> : <span className="text-xs text-slate-500">{m.orang_tua ? "Nomor WA belum diisi" : "Orang tua belum daftar"}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
