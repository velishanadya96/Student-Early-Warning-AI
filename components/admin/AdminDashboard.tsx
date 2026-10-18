"use client";

import Link from "next/link";
import { AlertTriangle, Database, MessageCircle, RefreshCw, UserCog, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAdminDashboard, useKaprodiDashboard } from "@/hooks/useData";
import { ErrorBox, Loading, Stat } from "@/components/risk/RiskParts";

export default function AdminDashboard() {
  const a = useAdminDashboard();
  const k = useKaprodiDashboard();
  const d = a.data;
  const r = k.data?.ringkasan;
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-blue-600">Administrator</p><h1 className="text-2xl font-bold sm:text-3xl">Dashboard Admin</h1><p className="mt-1 text-sm text-slate-500">Status data akademik, perhitungan risiko, dan pengiriman WhatsApp.</p></div>
        <Link href="/dashboard-admin/data"><Button variant="secondary"><RefreshCw size={16} className="mr-2" />Impor &amp; Hitung Risiko</Button></Link></div>
      {a.isLoading && <Loading rows={3} h="h-28" />}
      {a.isError && <ErrorBox error={a.error} onRetry={() => a.refetch()} />}
      {d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Users} label="Total Mahasiswa" value={d.mahasiswa} tone="blue" hint={`${d.mahasiswa_punya_akun} sudah punya akun`} />
            <Stat icon={Database} label="Skor tersimpan" value={d.skor_tersimpan} hint={d.periode_tersedia.length ? `Periode: ${d.periode_tersedia.join(", ")}` : "Belum ada data diimpor"} />
            <Stat icon={AlertTriangle} label="Risiko Tinggi" value={r?.High ?? "-"} tone="red" hint="Periode terbaru" />
            <Stat icon={UserCog} label="Orang tua terdaftar" value={d.orang_tua} hint={d.orang_tua_tanpa_wa ? `${d.orang_tua_tanpa_wa} belum mengisi no WA` : undefined} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center gap-2"><MessageCircle className="text-emerald-600" /><h2 className="text-lg font-bold">WhatsApp ke Orang Tua</h2><Badge variant="neutral">{d.wa_provider}</Badge></div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm"><div className="rounded-xl bg-amber-50 p-3"><p className="text-2xl font-bold">{d.wa.pending}</p>Menunggu</div><div className="rounded-xl bg-emerald-50 p-3"><p className="text-2xl font-bold">{d.wa.terkirim}</p>Terkirim</div><div className="rounded-xl bg-red-50 p-3"><p className="text-2xl font-bold">{d.wa.gagal}</p>Gagal</div></div>
              <p className="mt-4 text-xs text-slate-500">{d.wa_provider === "manual" ? "Mode manual: Dosen PA menekan tombol Kirim WhatsApp di dashboard-nya." : "Pengiriman otomatis aktif."}</p>
            </Card>
            <Card>
              <h2 className="mb-3 text-lg font-bold">Perlu Dilengkapi</h2>
              <ul className="space-y-2 text-sm">
                <li className={d.mahasiswa_tanpa_dosen_pa ? "text-amber-700" : "text-emerald-700"}>{d.mahasiswa_tanpa_dosen_pa ? `${d.mahasiswa_tanpa_dosen_pa} mahasiswa belum punya Dosen PA (tambahkan kolom nidn_dosen_pa di CSV atau tetapkan di Manajemen Pengguna).` : "Semua mahasiswa punya Dosen PA."}</li>
                <li className={d.orang_tua_tanpa_wa ? "text-amber-700" : "text-emerald-700"}>{d.orang_tua_tanpa_wa ? `${d.orang_tua_tanpa_wa} akun orang tua belum punya nomor WhatsApp.` : "Semua orang tua punya nomor WhatsApp."}</li>
                <li className={d.periode_tersedia.length ? "text-emerald-700" : "text-amber-700"}>{d.periode_tersedia.length ? "Data akademik sudah diimpor." : "Belum ada data akademik. Mulai dari menu Data Akademik."}</li>
              </ul>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
