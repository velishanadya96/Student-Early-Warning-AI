"use client";

import { useState } from "react";
import { useTambahCatatan } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import type { BarisMahasiswa } from "@/lib/types";
import { LABEL_KATEGORI } from "@/lib/types";

export default function InterventionForm({ mahasiswa, nim, onNim }: { mahasiswa: BarisMahasiswa[]; nim: string; onNim: (n: string) => void }) {
  const mutation = useTambahCatatan();
  const [note, setNote] = useState("");
  const [pesan, setPesan] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (note.trim().length < 10) return setMessage({ ok: false, text: "Catatan minimal 10 karakter." });
    mutation.mutate({ nim, isi_catatan: note.trim(), isi_pesan: pesan.trim() || undefined }, {
      onSuccess: () => { setNote(""); setPesan(""); setMessage({ ok: true, text: "Catatan tindak lanjut berhasil disimpan." }); },
      onError: (e) => setMessage({ ok: false, text: e.message }),
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-slate-50 p-5">
      <h2 className="font-bold">Tambah Catatan Tindak Lanjut</h2>
      <p className="mt-1 text-sm text-slate-500">Catatan tersimpan untuk skor risiko terbaru mahasiswa.</p>
      {message && <div role={message.ok ? "status" : "alert"} className={`mt-4 rounded-xl p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</div>}
      <div className="mt-4 grid gap-4">
        <div>
          <label htmlFor="nim" className="mb-2 block text-sm font-semibold">Mahasiswa</label>
          <select id="nim" value={nim} onChange={(e) => onNim(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            {mahasiswa.map((m) => <option key={m.nim} value={m.nim}>{m.nama} ({m.nim}){m.kategori ? ` - ${LABEL_KATEGORI[m.kategori]}` : ""}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="note" className="mb-2 block text-sm font-semibold">Catatan internal Dosen PA</label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Contoh: Jadwalkan konseling akademik dan evaluasi kehadiran." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="pesan" className="mb-2 block text-sm font-semibold">Pesan untuk mahasiswa (opsional)</label>
          <textarea id="pesan" value={pesan} onChange={(e) => setPesan(e.target.value)} rows={2} placeholder="Tampil di dashboard dan notifikasi mahasiswa." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500" />
        </div>
        <Button type="submit" disabled={mutation.isPending || !nim}>{mutation.isPending ? "Menyimpan..." : "Simpan Catatan"}</Button>
      </div>
    </form>
  );
}
