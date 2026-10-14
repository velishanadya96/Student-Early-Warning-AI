"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { importRosterApi, rosterCountApi, type RosterRow } from "@/lib/adminApi";

// Format: nim,nama,prodi,angkatan,email (baris pertama boleh header)
function parse(text: string): RosterRow[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((l) => l.split(/[,;\t]/).map((c) => c.trim()))
    .filter((c) => c[0] && c[0].toLowerCase() !== "nim")
    .map((c) => ({ nim: c[0] as string, nama: c[1] ?? "", prodi: c[2] || undefined, angkatan: c[3] ? Number(c[3]) || undefined : undefined, email: c[4] ? c[4].toLowerCase() : undefined }));
}

export default function RosterImport() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const { data } = useQuery({ queryKey: ["roster-count"], queryFn: rosterCountApi });
  const imp = useMutation({
    mutationFn: (rows: RosterRow[]) => importRosterApi(rows),
    onSuccess: (r) => { setMsg(`Selesai: ${r.added} baru, ${r.updated} diperbarui. Total ${r.total} mahasiswa.`); setErr(""); setText(""); qc.invalidateQueries({ queryKey: ["roster-count"] }); },
    onError: (e) => { setMsg(""); setErr(e instanceof Error ? e.message : "Gagal impor."); },
  });
  const rows = parse(text);

  return (
    <Card>
      <div className="space-y-3 p-4">
        <div>
          <h2 className="font-bold">Daftar Mahasiswa Resmi (Roster)</h2>
          <p className="text-sm text-slate-500">
            Tempel data dari prodi (CSV: <code>nim,nama,prodi,angkatan,email</code>). Kalau roster terisi, mahasiswa hanya bisa daftar dengan NIM yang ada di sini dan email Google yang cocok. Saat ini: <b>{data?.total ?? 0}</b> mahasiswa.
          </p>
        </div>
        {msg && <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</div>}
        {err && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        <textarea aria-label="Data roster CSV" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={"nim,nama,prodi,angkatan,email\nI0722001,Budi Santoso,D3 Teknik Informatika,2022,budi@gmail.com"} className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-blue-500" />
        <Button disabled={!rows.length || imp.isPending} onClick={() => imp.mutate(rows)}>{imp.isPending ? "Mengimpor..." : `Impor ${rows.length} baris`}</Button>
      </div>
    </Card>
  );
}
