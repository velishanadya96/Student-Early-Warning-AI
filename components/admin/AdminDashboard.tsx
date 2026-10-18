"use client";

import { AlertTriangle, Database, MessageCircle, UserCog, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Hero } from "@/components/ui/Hero";
import { useAdminDashboard, useKaprodiDashboard } from "@/hooks/useData";
import { ErrorBox, Loading, Stat } from "@/components/risk/RiskParts";

export default function AdminDashboard() {
  const a = useAdminDashboard();
  const k = useKaprodiDashboard();
  const d = a.data;
  const r = k.data?.ringkasan;
  return (
    <section className="space-y-4">
      <p className="text-sm font-semibold text-slate-500">Admin · Dashboard</p>
      <Hero
        eyebrow={d?.periode_tersedia.length ? `Periode ${d.periode_tersedia.join(", ")}` : "Belum ada data diimpor"}
        title="Unggah data, lalu"
        accent="hitung risiko."
        action={{ href: "/dashboard-admin/data", label: "Impor & hitung risiko" }}
      >
        Status data akademik, perhitungan risiko, dan pengiriman WhatsApp ke orang tua.
      </Hero>
      {a.isLoading && <Loading rows={3} h="h-28" />}
      {a.isError && <ErrorBox error={a.error} onRetry={() => a.refetch()} />}
      {d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Users} label="Total mahasiswa" value={d.mahasiswa} tone="blue" hint={`${d.mahasiswa_punya_akun} sudah punya akun`} />
            <Stat icon={Database} label="Skor tersimpan" value={d.skor_tersimpan} hint={d.periode_tersedia.length ? `Periode: ${d.periode_tersedia.join(", ")}` : "Belum ada data diimpor"} />
            <Stat icon={AlertTriangle} label="Risiko tinggi" value={r?.High ?? "-"} tone="red" hint="Periode terbaru" />
            <Stat icon={UserCog} label="Orang tua terdaftar" value={d.orang_tua} hint={d.orang_tua_tanpa_wa ? `${d.orang_tua_tanpa_wa} belum mengisi nomor WA` : undefined} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center gap-2"><MessageCircle className="text-emerald-600" /><h2 className="text-xl font-extrabold">WhatsApp ke orang tua</h2><Badge variant="neutral">{d.wa_provider}</Badge></div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm"><div className="rounded-2xl bg-amber-50 p-3"><p className="text-2xl font-extrabold">{d.wa.pending}</p>Menunggu dikirim</div><div className="rounded-2xl bg-emerald-50 p-3"><p className="text-2xl font-extrabold">{d.wa.terkirim}</p>Terkirim</div><div className="rounded-2xl bg-red-50 p-3"><p className="text-2xl font-extrabold">{d.wa.gagal}</p>Gagal terkirim</div></div>
              <p className="mt-4 text-xs text-slate-500">{d.wa_provider === "manual" ? "Mode manual: Dosen PA menekan tombol Kirim WhatsApp di dashboard-nya." : "Pengiriman otomatis aktif."}</p>
            </Card>
            <Card>
              <h2 className="mb-3 text-xl font-extrabold">Perlu dilengkapi</h2>
              <ul className="space-y-2 text-sm">
                <li className={d.mahasiswa_tanpa_dosen_pa ? "text-amber-700" : "text-emerald-700"}>{d.mahasiswa_tanpa_dosen_pa ? `${d.mahasiswa_tanpa_dosen_pa} mahasiswa belum ditetapkan Dosen PA-nya (tambahkan kolom nidn_dosen_pa di CSV atau tetapkan di Manajemen Pengguna).` : "Semua mahasiswa punya Dosen PA."}</li>
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
