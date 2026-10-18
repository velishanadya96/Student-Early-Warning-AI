"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, PlayCircle, UploadCloud, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useHitungRisiko, useAdminDashboard } from "@/hooks/useData";
import { ImportFailed, importApi, periodeSekarang } from "@/lib/dataApi";
import type { HitungHasil, ImportError, ImportHasil } from "@/lib/types";

type Hasil = { jenis: string; ok?: ImportHasil; errors?: ImportError[]; totalError?: number; pesan?: string };

function Unggah({ jenis, judul, deskripsi, kolom, contoh, periode, onHasil }: {
  jenis: "akademik" | "tugas"; judul: string; deskripsi: string; kolom: string; contoh: string; periode: string; onHasil: (h: Hasil) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function unggah() {
    if (!file) return;
    setBusy(true);
    try {
      onHasil({ jenis: judul, ok: await importApi(jenis, file, periode) });
      setFile(null); if (ref.current) ref.current.value = "";
    } catch (e) {
      onHasil(e instanceof ImportFailed ? { jenis: judul, errors: e.errors, totalError: e.totalError, pesan: e.message } : { jenis: judul, pesan: e instanceof Error ? e.message : "Gagal mengunggah. Coba lagi." });
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <FileSpreadsheet className="text-blue-600" />
      <h2 className="mt-3 font-bold">{judul}</h2>
      <p className="mt-1 text-sm text-slate-500">{deskripsi}</p>
      <p className="mt-3 text-xs text-slate-500">Kolom: <code className="rounded bg-slate-100 px-1">{kolom}</code></p>
      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-sm font-semibold hover:bg-slate-50">
        <UploadCloud size={17} className="mr-2" />{file ? file.name : "Pilih file CSV atau Excel"}
        <input ref={ref} data-testid={`file-${jenis}`} type="file" accept=".csv,.xlsx,text/csv" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={unggah} disabled={!file || busy}>{busy ? "Mengunggah..." : `Unggah ke periode ${periode}`}</Button>
        <a href={`/templates/${contoh}`} download className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600"><Download size={14} />Unduh contoh</a>
      </div>
    </Card>
  );
}

export default function AdminData() {
  const [periode, setPeriode] = useState(periodeSekarang());
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [hitung, setHitung] = useState<HitungHasil | null>(null);
  const [errHitung, setErrHitung] = useState("");
  const mutasi = useHitungRisiko();
  const adm = useAdminDashboard();
  const periodeValid = /^20\d{2}-[12]$/.test(periode);

  function jalankan() {
    setErrHitung(""); setHitung(null);
    mutasi.mutate(periode, { onSuccess: setHitung, onError: (e) => setErrHitung(e.message) });
  }

  return (
    <section className="space-y-6">
      <div><p className="text-sm font-semibold text-blue-600">Admin</p><h1 className="text-2xl font-bold">Data Akademik</h1>
        <p className="mt-1 text-sm text-slate-500">Urutan: (1) unggah data akademik, (2) unggah data tugas, (3) hitung risiko. Dosen PA, mahasiswa, dan orang tua langsung melihat hasilnya; orang tua mahasiswa berisiko tinggi dikirimi WhatsApp.</p></div>

      <Card>
        <label className="text-sm font-semibold">Periode akademik <input value={periode} onChange={(e) => setPeriode(e.target.value.trim())} aria-label="Periode" className="ml-2 w-28 rounded-xl border border-slate-200 px-3 py-2 font-normal" placeholder="2026-1" /></label>
        <span className="ml-3 text-xs text-slate-500">Format TAHUN-1 (ganjil, Agu-Jan) atau TAHUN-2 (genap, Feb-Jul). {adm.data?.periode_tersedia.length ? `Sudah ada: ${adm.data.periode_tersedia.join(", ")}.` : ""}</span>
        {!periodeValid && <p role="alert" className="mt-2 text-sm text-red-600">Periode harus berformat 2026-1 atau 2026-2.</p>}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Unggah jenis="akademik" judul="1. Data Akademik (nilai + kehadiran)" deskripsi="Satu baris = satu mahasiswa x satu mata kuliah. NIM yang belum ada otomatis dibuat (isi kolom nama). Isi nidn_dosen_pa agar mahasiswa masuk bimbingan dosen."
          kolom="nim, kode_mk, nilai_mk, total_pertemuan, hadir [+ nama, prodi, angkatan, ipk, nidn_dosen_pa]" contoh="contoh-akademik-2026-1.csv" periode={periode} onHasil={setHasil} />
        <Unggah jenis="tugas" judul="2. Data Tugas" deskripsi="Satu baris = satu tugas. Kosongkan waktu_kumpul bila belum dikumpulkan. Unggah data akademik lebih dulu."
          kolom="nim, kode_mk [+ judul, waktu_kumpul, status_terlambat]" contoh="contoh-tugas-2026-1.csv" periode={periode} onHasil={setHasil} />
      </div>

      {hasil && (
        <Card tone={hasil.ok ? "blue" : "red"} role="status" data-testid="hasil-impor">
          <div className="flex items-center gap-2 font-bold">{hasil.ok ? <CheckCircle2 className="text-emerald-600" size={18} /> : <XCircle className="text-red-600" size={18} />}{hasil.jenis}</div>
          {hasil.ok && <p className="mt-2 text-sm">Berhasil: {hasil.ok.baris} baris, {hasil.ok.mahasiswa} mahasiswa{hasil.ok.mahasiswa_baru ? ` (${hasil.ok.mahasiswa_baru} baru)` : ""}{hasil.ok.terkumpul !== undefined ? `, ${hasil.ok.terkumpul} tugas terkumpul` : ""} untuk periode {hasil.ok.periode}. Lanjutkan ke langkah berikutnya.</p>}
          {!hasil.ok && <p className="mt-2 text-sm text-red-700">{hasil.pesan}</p>}
          {hasil.errors && (
            <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr><th className="p-2">Baris</th><th className="p-2">Kolom</th><th className="p-2">Masalah</th></tr></thead>
              <tbody>{hasil.errors.map((e, i) => <tr key={i} className="border-b last:border-0"><td className="p-2 font-mono">{e.baris}</td><td className="p-2">{e.kolom}</td><td className="p-2">{e.pesan}</td></tr>)}</tbody></table>
              {(hasil.totalError ?? 0) > hasil.errors.length && <p className="mt-2 text-xs text-slate-500">Menampilkan {hasil.errors.length} dari {hasil.totalError} masalah.</p>}</div>
          )}
        </Card>
      )}

      <Card>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">3. Hitung Risiko &amp; Kirim Notifikasi</h2><p className="text-sm text-slate-500">Model menghitung skor semua mahasiswa pada periode {periode}. Notifikasi dan WhatsApp hanya dibuat untuk mahasiswa yang baru masuk risiko tinggi.</p></div>
          <Button onClick={jalankan} disabled={mutasi.isPending || !periodeValid}><PlayCircle size={17} className="mr-2" />{mutasi.isPending ? "Menghitung..." : "Hitung risiko"}</Button></div>
        {errHitung && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errHitung}</div>}
        {hitung && (
          <div className="mt-4 space-y-3" data-testid="hasil-hitung">
            <div className="flex flex-wrap gap-2"><Badge variant="neutral">{hitung.dihitung} dihitung</Badge><Badge variant="high">{hitung.High} tinggi</Badge><Badge variant="medium">{hitung.Medium} sedang</Badge><Badge variant="low">{hitung.Low} rendah</Badge></div>
            <p className="text-sm text-slate-700">{hitung.baru_high.length ? `${hitung.baru_high.length} mahasiswa baru masuk risiko tinggi (${hitung.baru_high.join(", ")}). ` : "Tidak ada mahasiswa yang baru masuk risiko tinggi. "}{hitung.notifikasi_wa} pesan WhatsApp ke orang tua dibuat.</p>
            {hitung.high_tanpa_ortu.length > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Belum bisa dikirimi WhatsApp karena orang tua belum mendaftar atau belum mengisi nomor WA: {hitung.high_tanpa_ortu.join(", ")}.</p>}
            {hitung.high_tanpa_dosen_pa.length > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Dosen PA belum ditetapkan (tidak muncul di dashboard Dosen PA mana pun): {hitung.high_tanpa_dosen_pa.join(", ")}.</p>}
          </div>
        )}
      </Card>
    </section>
  );
}
