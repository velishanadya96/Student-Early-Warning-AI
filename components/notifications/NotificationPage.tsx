"use client";

import { Bell, CheckCircle2, MessageCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useKirimUlang, useNotifSistem, useProsesAntrean, useTandaiBaca, useTandaiTerkirim, useWaOrtu } from "@/hooks/useData";
import { Empty, ErrorBox, Loading } from "@/components/risk/RiskParts";

const STATUS = { pending: ["Menunggu dikirim", "medium"], terkirim: ["Terkirim", "low"], gagal: ["Gagal terkirim", "high"] } as const;
const tgl = (s: string | null) => (s ? new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "");

/** Dosen PA: pesan WhatsApp ke orang tua (berisi alasan risiko tinggi). */
function WaOrtu() {
  const q = useWaOrtu();
  const terkirim = useTandaiTerkirim();
  const ulang = useKirimUlang();
  const proses = useProsesAntrean();
  const manual = q.data?.provider === "manual";

  return (
    <section>
      <div className="mb-6"><p className="text-sm font-semibold text-blue-600">Dosen PA</p><h1 className="text-2xl font-bold">Notifikasi WhatsApp ke Orang Tua</h1>
        <p className="mt-1 text-sm text-slate-500">Saat mahasiswa masuk kategori Tinggi, sistem menyiapkan pesan untuk orang tua berisi penyebabnya (kehadiran, IPK, nilai, atau tugas).</p></div>
      {q.data && (
        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
          {manual ? <><b>Mode manual.</b> Tekan <b>Kirim WhatsApp</b> untuk membuka WhatsApp dengan pesan siap kirim, kirim ke orang tua, lalu tekan <b>Tandai terkirim</b>.</>
            : <><b>Pengiriman otomatis ({q.data.provider}).</b> Pesan dikirim sistem; yang gagal dicoba ulang hingga 3 kali.{" "}
              <Button size="sm" variant="secondary" onClick={() => proses.mutate()} disabled={proses.isPending}><RefreshCw size={14} className="mr-1" />Proses antrean sekarang</Button></>}
        </div>
      )}
      {q.isLoading && <Loading rows={3} h="h-32" />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && q.data.notifikasi.length === 0 && <Empty>Belum ada pesan. Pesan dibuat otomatis ketika mahasiswa bimbingan baru masuk kategori Tinggi dan orang tuanya sudah mendaftar dengan nomor WhatsApp.</Empty>}
      <div className="space-y-4">
        {q.data?.notifikasi.map((n) => {
          const [label, variant] = STATUS[n.status as keyof typeof STATUS] ?? ["-", "neutral"];
          return (
            <Card key={n.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-bold">{n.nama_mahasiswa} <span className="text-xs font-normal text-slate-400">{n.nim} · periode {n.periode}</span></p>
                  <p className="text-sm text-slate-500">Ke: {n.orang_tua ?? "Orang tua"} · +{n.no_tujuan}</p></div>
                <Badge variant={variant}>{label}</Badge>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-sm leading-6 text-slate-700">{n.isi}</pre>
              {(terkirim.isError || ulang.isError) && <p role="alert" className="mt-2 text-sm text-red-600">{(terkirim.error ?? ulang.error)?.message}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {n.status !== "terkirim" && n.link && <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><MessageCircle size={16} />Kirim WhatsApp</a>}
                {n.status !== "terkirim" && <Button variant="secondary" size="sm" onClick={() => terkirim.mutate(n.id)} disabled={terkirim.isPending}><CheckCircle2 size={15} className="mr-1" />Tandai terkirim</Button>}
                {!manual && n.status === "gagal" && <Button variant="secondary" size="sm" onClick={() => ulang.mutate(n.id)} disabled={ulang.isPending}><RefreshCw size={15} className="mr-1" />Kirim ulang</Button>}
                <span className="text-xs text-slate-400">{tgl(n.waktu)}{n.percobaan ? ` · ${n.percobaan} percobaan` : ""}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/** Mahasiswa / orang tua: notifikasi di dashboard. */
function Sistem() {
  const q = useNotifSistem();
  const baca = useTandaiBaca();
  const list = q.data?.notifikasi ?? [];
  return (
    <section>
      <div className="mb-6"><p className="text-sm font-semibold text-blue-600">Notifikasi</p><h1 className="text-2xl font-bold">Peringatan Dini</h1><p className="mt-1 text-sm text-slate-500">Muncul saat risiko akademik masuk kategori Tinggi atau ada pesan dari Dosen PA.</p></div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2"><Card tone="red"><ShieldAlert className="text-red-600" /><p className="mt-3 text-sm text-slate-500">Belum dibaca</p><p className="text-3xl font-bold">{q.data?.belum_dibaca ?? 0}</p></Card><Card><Bell className="text-blue-600" /><p className="mt-3 text-sm text-slate-500">Total notifikasi</p><p className="text-3xl font-bold">{list.length}</p></Card></div>
      <Card>
        {q.isLoading && <Loading rows={3} h="h-20" />}
        {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
        {q.data && list.length === 0 && <Empty>Belum ada notifikasi.</Empty>}
        <div className="space-y-3">
          {list.map((n) => (
            <article key={n.id} className={`flex gap-4 rounded-xl border p-4 ${n.dibaca ? "" : "border-blue-200 bg-blue-50/40"}`}>
              <span className="h-fit rounded-xl bg-red-50 p-3"><ShieldAlert className="text-red-600" size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{n.isi}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400"><span>{tgl(n.waktu)}</span>{n.periode && <span>periode {n.periode}</span>}
                  {!n.dibaca && <button onClick={() => baca.mutate(n.id)} className="font-semibold text-blue-600 underline">Tandai dibaca</button>}</div>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </section>
  );
}

export default function NotificationPage({ mode = "sistem" }: { mode?: "dosen" | "sistem" }) {
  return mode === "dosen" ? <WaOrtu /> : <Sistem />;
}
