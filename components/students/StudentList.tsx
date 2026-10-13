"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useDialog } from "@/hooks/useDialog";
import { useCreateStudent, useDeleteStudent, useStudentsQuery, useUpdateStudent } from "@/hooks/useData";
import { studentSchema, type StudentInput } from "@/lib/schemas";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { calculateRisk } from "@/lib/risk";
import type { Student } from "@/lib/types";

const emptyForm: StudentInput = { nim: "", name: "", prodi: "D3 Teknik Informatika", angkatan: 2026, attendance: 80, gpa: 3, lms: 80, assignments: 80 };

function StudentModal({ editing, onClose, onSaved }: { editing: Student | null; onClose: () => void; onSaved: (message: string) => void }) {
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const [form, setForm] = useState<StudentInput>(editing ? { ...editing, nim: String(editing.nim) } : emptyForm);
  const mutation = editing ? update : create;
  const dialogRef = useDialog<HTMLFormElement>(onClose);
  const [error, setError] = useState("");

  function setField<K extends keyof StudentInput>(key: K, value: StudentInput[K]) { setForm((prev) => ({ ...prev, [key]: value })); }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const result = studentSchema.safeParse({ ...form, angkatan: Number(form.angkatan), attendance: Number(form.attendance), gpa: Number(form.gpa), lms: Number(form.lms), assignments: Number(form.assignments) });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Periksa kembali data."); return; }
    mutation.mutate(result.data, { onSuccess: () => { onSaved(editing ? "Data mahasiswa berhasil diperbarui." : "Mahasiswa berhasil ditambahkan."); onClose(); }, onError: (e) => setError(e.message) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="student-dialog-title">
      <form ref={dialogRef} onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between"><div><h2 id="student-dialog-title" className="text-xl font-bold">{editing ? "Edit Mahasiswa" : "Tambah Mahasiswa"}</h2><p className="text-sm text-slate-500">Lengkapi data akademik mahasiswa.</p></div><button type="button" onClick={onClose} aria-label="Tutup form" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
        {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">NIM<input value={form.nim} disabled={Boolean(editing)} onChange={(e) => setField("nim", e.target.value)} className="mt-1 w-full rounded-xl border p-2.5 font-normal disabled:bg-slate-100" /></label>
          <label className="text-sm font-semibold">Nama<input value={form.name} onChange={(e) => setField("name", e.target.value)} className="mt-1 w-full rounded-xl border p-2.5 font-normal" /></label>
          <label className="text-sm font-semibold">Program Studi<input value={form.prodi} onChange={(e) => setField("prodi", e.target.value)} className="mt-1 w-full rounded-xl border p-2.5 font-normal" /></label>
          <label className="text-sm font-semibold">Angkatan<input type="number" value={form.angkatan} onChange={(e) => setField("angkatan", Number(e.target.value))} className="mt-1 w-full rounded-xl border p-2.5 font-normal" /></label>
          {(["attendance", "gpa", "lms", "assignments"] as const).map((key) => <label key={key} className="text-sm font-semibold">{key === "attendance" ? "Presensi (%)" : key === "gpa" ? "IPK" : key === "lms" ? "Aktivitas LMS (%)" : "Pengumpulan Tugas (%)"}<input type="number" min={0} max={key === "gpa" ? 4 : 100} step={key === "gpa" ? 0.01 : 1} value={form[key]} onChange={(e) => setField(key, Number(e.target.value))} className="mt-1 w-full rounded-xl border p-2.5 font-normal" /></label>)}
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Batal</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Mahasiswa"}</Button></div>
      </form>
    </div>
  );
}

export default function StudentList() {
  const { data, isLoading, isError, refetch } = useStudentsQuery();
  const deleteMutation = useDeleteStudent();
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"Semua" | "Tinggi" | "Sedang" | "Rendah">("Semua");
  const [modal, setModal] = useState<"add" | Student | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => (data ?? []).filter((s) => {
    const q = keyword.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) || s.nim.toLowerCase().includes(q);
    const { category } = calculateRisk(s);
    return matchesSearch && (filter === "Semua" || category === filter);
  }), [data, keyword, filter]);

  function remove(student: Student) {
    if (!window.confirm(`Hapus data ${student.name} (${student.nim})?`)) return;
    deleteMutation.mutate(String(student.nim), { onSuccess: () => setMessage("Data mahasiswa berhasil dihapus."), onError: (e) => setMessage(e.message) });
  }

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold">Data Mahasiswa</h1><p className="mt-1 text-sm text-slate-500">Kelola data mahasiswa yang menjadi dasar sistem early warning.</p></div><Button onClick={() => setModal("add")}><Plus size={18} className="mr-2" />Tambah Mahasiswa</Button></div>
      {message && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      <Card>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input aria-label="Cari mahasiswa" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Cari nama atau NIM..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500" /></div><div className="flex flex-wrap gap-2" role="group" aria-label="Filter risiko">{(["Semua", "Tinggi", "Sedang", "Rendah"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${filter === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div></div>
        {isLoading && <div className="space-y-3" aria-live="polite">{[1,2,3,4].map((x) => <div key={x} className="skeleton h-14 rounded-lg" />)}</div>}
        {isError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">Data gagal dimuat. <Button size="sm" variant="secondary" onClick={() => refetch()}>Coba lagi</Button></div>}
        {!isLoading && !isError && filtered.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Data mahasiswa tidak ditemukan.</div>}
        {!isLoading && !isError && filtered.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr><th className="p-3">NIM</th><th className="p-3">Nama</th><th className="p-3">Prodi</th><th className="p-3">IPK</th><th className="p-3">Presensi</th><th className="p-3">LMS</th><th className="p-3">Tugas</th><th className="p-3">Aksi</th></tr></thead><tbody>{filtered.map((s) => <tr key={s.nim} className="border-b last:border-0 hover:bg-slate-50"><td className="p-3 font-semibold">{s.nim}</td><td className="p-3">{s.name}</td><td className="p-3">{s.prodi}</td><td className="p-3 font-semibold">{s.gpa.toFixed(2)}</td><td className="p-3">{s.attendance}%</td><td className="p-3">{s.lms}%</td><td className="p-3">{s.assignments}%</td><td className="p-3"><div className="flex gap-2"><Button size="sm" variant="secondary" aria-label={`Edit ${s.name}`} onClick={() => setModal(s)}><Pencil size={15} /></Button><Button size="sm" variant="danger" aria-label={`Hapus ${s.name}`} onClick={() => remove(s)} disabled={deleteMutation.isPending}><Trash2 size={15} /></Button></div></td></tr>)}</tbody></table></div>}
      </Card>
      {modal && <StudentModal editing={modal === "add" ? null : modal} onClose={() => setModal(null)} onSaved={setMessage} />}
    </section>
  );
}
