"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Hero } from "@/components/ui/Hero";
import { Radar, type RadarLevel } from "@/components/ui/Radar";
import { useDosenDashboard } from "@/hooks/useData";
import { MahasiswaCards } from "@/components/risk/MahasiswaCards";
import { Avatar, Empty, ErrorBox, FaktorChips, KategoriBadge, Loading, PeriodeSelect, Ring } from "@/components/risk/RiskParts";

const waStatus = { pending: ["Menunggu dikirim", "medium"], terkirim: ["Terkirim", "low"], gagal: ["Gagal terkirim", "high"] } as const;
const LEVEL = { High: "high", Medium: "medium", Low: "low" } as const;

export default function DashboardHome() {
  const [periode, setPeriode] = useState<string | null>(null);
  const q = useDosenDashboard(periode);
  const d = q.data;
  const r = d?.ringkasan;
  const levels: RadarLevel[] = (d?.mahasiswa ?? []).flatMap((m) => (m.kategori ? [LEVEL[m.kategori]] : []));
  const dihitung = r ? r.High + r.Medium + r.Low : 0;
  const persenAman = r && dihitung ? (r.Low / dihitung) * 100 : 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">Dosen PA · Dashboard risiko akademik</p>
        <div className="flex items-center gap-3">
          {d?.periode && <Badge variant="neutral">Periode {d.periode}</Badge>}
          <PeriodeSelect value={periode} options={d?.periode_tersedia ?? []} onChange={setPeriode} />
        </div>
      </div>

      {q.isLoading && <Loading rows={3} h="h-40" />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {d && r && (
        <>
          <div className="grid gap-4 lg:grid-cols-12">
            <Hero
              className="lg:col-span-8 lg:row-span-2"
              eyebrow={`${r.total} mahasiswa bimbingan`}
              title={r.High > 0 ? `${r.High} mahasiswa perlu` : "Semua mahasiswa"}
              accent={r.High > 0 ? "perhatian." : "berisiko rendah."}
              action={{ href: "/dashboard/mahasiswa", label: "Lihat daftar" }}
              visual={<Radar levels={levels} />}
            >
              Diurutkan dari risiko tertinggi, lengkap dengan penyebabnya.
            </Hero>

            <div className="card flex items-center gap-5 p-5 lg:col-span-4 sm:p-6">
              <Ring persen={persenAman} label={`${Math.round(persenAman)} persen mahasiswa risiko rendah`} />
              <div>
                <p className="text-sm font-semibold text-slate-500">Risiko rendah</p>
                <p className="text-3xl font-extrabold tracking-tight">{r.Low} mahasiswa</p>
                <p className="text-sm text-slate-500">{r.Medium} sedang, {r.High} tinggi</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:col-span-4">
              <div className="card p-5">
                <p className="text-sm font-semibold text-slate-500">Risiko sedang</p>
                <p className="mt-3 text-5xl font-extrabold leading-none tracking-tight" style={{ color: "var(--risk-med)" }}>{r.Medium}</p>
                <p className="mt-2 text-xs text-slate-500">pantau berkala</p>
              </div>
              <div className="card p-5">
                <p className="text-sm font-semibold text-slate-500">Risiko tinggi</p>
                <p className="mt-3 text-5xl font-extrabold leading-none tracking-tight" style={{ color: "var(--risk-high)" }}>{r.High}</p>
                <p className="mt-2 text-xs text-slate-500">perlu dihubungi</p>
              </div>
            </div>
          </div>

          {d.wa_menunggu > 0 && (
            <Link href="/dashboard/notifikasi" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100">
              <MessageCircle size={20} /> {d.wa_menunggu} pesan peringatan ke WhatsApp orang tua siap dikirim. Buka dan kirim sekarang →
            </Link>
          )}

          <Card>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><h2 className="text-xl font-extrabold">Mahasiswa yang perlu perhatian</h2><p className="text-sm text-slate-500">Penyebab diambil dari model: kehadiran, IPK, rata-rata nilai, atau pengumpulan tugas.</p></div>
              <Link href="/dashboard/mahasiswa" className="shrink-0 text-sm font-bold text-blue-600 underline-offset-4 hover:underline">Lihat semua</Link>
            </div>
            {d.mahasiswa.length === 0 ? <Empty>Belum ada mahasiswa bimbingan. Admin perlu mengimpor data dan menetapkan Dosen PA.</Empty> : (
              <>
              <MahasiswaCards rows={d.mahasiswa} extra={(m) => (m.kategori === "High" ? <p className="mt-2.5 text-xs text-slate-500">{m.wa ? <Badge variant={waStatus[m.wa.status][1]}>WA {waStatus[m.wa.status][0]}</Badge> : m.orang_tua ? "Nomor WA orang tua belum diisi" : "Orang tua belum mendaftar"}</p> : null)} />
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3 font-bold">Mahasiswa</th><th className="p-3 font-bold">Skor</th><th className="p-3 font-bold">Kategori</th><th className="p-3 font-bold">Penyebab</th><th className="p-3 font-bold">WA orang tua</th></tr></thead>
                  <tbody>
                    {d.mahasiswa.map((m) => (
                      <tr key={m.nim} className={`border-b border-slate-100 align-middle last:border-0 ${m.kategori === "High" ? "bg-red-50/50" : ""}`}>
                        <td className="p-3"><div className="flex items-center gap-3"><Avatar nama={m.nama} high={m.kategori === "High"} /><div><p className="font-semibold">{m.nama}</p><p className="text-xs text-slate-400">{m.nim}</p></div></div></td>
                        <td className="p-3 font-bold">{m.skor === null ? "-" : m.skor.toFixed(2)}</td>
                        <td className="p-3"><KategoriBadge kategori={m.kategori} /></td>
                        <td className="p-3"><FaktorChips faktor={m.faktor} /></td>
                        <td className="p-3">{m.kategori !== "High" ? <span className="text-slate-400">-</span> : m.wa ? <Badge variant={waStatus[m.wa.status][1]}>{waStatus[m.wa.status][0]}</Badge> : <span className="text-xs text-slate-500">{m.orang_tua ? "Nomor WA belum diisi" : "Orang tua belum mendaftar"}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
