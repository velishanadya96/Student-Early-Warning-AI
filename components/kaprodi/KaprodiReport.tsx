"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useKaprodiDashboard } from "@/hooks/useData";
import { ErrorBox, Loading, PeriodeSelect } from "@/components/risk/RiskParts";
import { unduhLaporan } from "@/lib/dataApi";

export default function KaprodiReport() {
  const [periode, setPeriode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const q = useKaprodiDashboard(periode);
  const d = q.data;

  async function unduh(format: "xlsx" | "pdf") {
    setError(""); setBusy(format);
    try { await unduhLaporan(format, d?.periode ?? periode); } catch (e) { setError(e instanceof Error ? e.message : "Laporan gagal dibuat."); } finally { setBusy(null); }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-blue-600">Kaprodi</p><h1 className="text-2xl font-bold">Laporan Risiko Program Studi</h1><p className="mt-1 text-sm text-slate-500">Laporan untuk rapat dan akreditasi, dibuat dari data tersimpan di server.</p></div>
        <div className="flex flex-wrap items-center gap-2"><PeriodeSelect value={periode} options={d?.periode_tersedia ?? []} onChange={setPeriode} />
          <Button onClick={() => unduh("xlsx")} disabled={!d || busy !== null}><FileSpreadsheet size={17} className="mr-2" />{busy === "xlsx" ? "Menyiapkan..." : "Excel"}</Button>
          <Button variant="secondary" onClick={() => unduh("pdf")} disabled={!d || busy !== null}><Download size={17} className="mr-2" />{busy === "pdf" ? "Menyiapkan..." : "PDF"}</Button></div>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <Card>
        {q.isLoading && <Loading rows={5} />}
        {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
        {d && (
          <>
            <p className="mb-4 text-sm text-slate-600">Periode <b>{d.periode ?? "-"}</b>: {d.ringkasan.total} mahasiswa, <b className="text-red-600">{d.ringkasan.High} tinggi</b>, <b className="text-amber-600">{d.ringkasan.Medium} sedang</b>, <b className="text-emerald-600">{d.ringkasan.Low} rendah</b>.</p>
            <p className="text-sm text-slate-500">File berisi NIM, nama, angkatan, Dosen PA, IPK, rata-rata nilai, kehadiran, tugas terkumpul, skor, kategori, dan penyebab untuk setiap mahasiswa.</p>
          </>
        )}
      </Card>
    </section>
  );
}
