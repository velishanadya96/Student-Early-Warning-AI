"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { kontakDosenPaApi, waLink } from "@/lib/authApi";

/** Dashboard Orang Tua: kontak WhatsApp Dosen PA dari anak yang dipantau (GET /api/kontak/dosen-pa). */
export default function KontakDosenOrtu() {
  const kontak = useQuery({ queryKey: ["kontak", "dosen-pa"], queryFn: kontakDosenPaApi, staleTime: 30_000 });
  const data = kontak.data;
  const link = waLink(data?.no_wa_dosen_pa, `Selamat siang, saya orang tua dari ${data?.nama_mahasiswa ?? "mahasiswa"}.`);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">Orang Tua</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Kontak Dosen PA</h1>
        <p className="mt-1 text-sm text-slate-500">Dosen Pembimbing Akademik {data?.nama_mahasiswa ?? "anak Anda"}.</p>
      </div>
      <Card>
        {kontak.isLoading && <div className="skeleton h-16 rounded-lg" aria-live="polite" />}
        {kontak.isError && (
          <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {kontak.error instanceof Error ? kontak.error.message : "Gagal memuat data kontak."}{" "}
            <Button size="sm" variant="secondary" onClick={() => kontak.refetch()}>Coba lagi</Button>
          </div>
        )}
        {data && !data.dosen_pa && <p className="text-sm text-slate-500">Dosen PA belum ditentukan oleh Admin.</p>}
        {data?.dosen_pa && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold">{data.dosen_pa}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Phone size={15} />{data.no_wa_dosen_pa ? `+${data.no_wa_dosen_pa}` : "Nomor belum tersedia"}</p>
            </div>
            {link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"><MessageCircle size={16} />Chat via WhatsApp</a>}
          </div>
        )}
      </Card>
    </section>
  );
}
