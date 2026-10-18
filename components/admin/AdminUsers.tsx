"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, UserPlus, UserRoundX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import RosterImport from "@/components/admin/RosterImport";
import { assignDosenApi, createUserApi, listUsersApi, setActiveApi, type NewUser } from "@/lib/adminApi";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", kaprodi: "Kaprodi", dosen: "Dosen PA", mahasiswa: "Mahasiswa", orangtua: "Orang Tua" };
const empty = { role: "mahasiswa", name: "", email: "", password: "", nim: "", nidn: "", no_wa: "" };
const field = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

// FR-12: kelola akun. Data nyata dari Flask (/users), bukan data contoh.
export default function AdminUsers() {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: users = [], isLoading, error: loadError } = useQuery({ queryKey: ["admin-users"], queryFn: listUsersApi });
  const dosenList = users.filter((u) => u.role === "dosen" && u.is_active);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });
  const fail = (e: unknown) => { setMessage(""); setError(e instanceof Error ? e.message : "Gagal."); };

  const create = useMutation({
    mutationFn: (u: NewUser) => createUserApi(u),
    onSuccess: () => { setMessage("Akun berhasil dibuat."); setError(""); setForm(empty); setOpen(false); refresh(); },
    onError: fail,
  });
  const toggle = useMutation({
    mutationFn: (v: { id: number; active: boolean }) => setActiveApi(v.id, v.active),
    onSuccess: () => { setMessage("Status akun diperbarui."); setError(""); refresh(); },
    onError: fail,
  });
  const assign = useMutation({
    mutationFn: (v: { nim: string; id: number }) => assignDosenApi(v.nim, v.id),
    onSuccess: () => { setMessage("Dosen PA berhasil ditugaskan."); setError(""); refresh(); },
    onError: fail,
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");
    const body: NewUser = { role: form.role as NewUser["role"], name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password };
    if (form.role === "mahasiswa" || form.role === "orangtua") body.nim = form.nim.trim();
    if (form.role === "dosen") body.nidn = form.nidn.trim();
    if (form.role === "dosen" || form.role === "orangtua") body.no_wa = form.no_wa.trim();
    create.mutate(body);
  }
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Administrator</p>
          <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">FR-12: tambah akun, ubah status, dan tugaskan Dosen PA. Data tersimpan di database.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}><UserPlus size={17} className="mr-2" />{open ? "Tutup form" : "Tambah Pengguna"}</Button>
      </div>

      {message && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      {(error || loadError) && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error || (loadError as Error).message}</div>}

      {open && (
        <Card>
          <form onSubmit={submit} className="grid gap-3 p-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Role
              <select className={`${field} mt-1`} value={form.role} onChange={set("role")} aria-label="Role">
                {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">Nama lengkap<input className={`${field} mt-1`} value={form.name} onChange={set("name")} required /></label>
            <label className="text-sm font-semibold text-slate-700">Email (akun Google)<input className={`${field} mt-1`} type="email" value={form.email} onChange={set("email")} required /></label>
            <label className="text-sm font-semibold text-slate-700">Password (min. 8)<input className={`${field} mt-1`} type="password" value={form.password} onChange={set("password")} minLength={8} required /></label>
            {(form.role === "mahasiswa" || form.role === "orangtua") && (
              <label className="text-sm font-semibold text-slate-700">{form.role === "orangtua" ? "NIM mahasiswa yang dipantau" : "NIM"}<input className={`${field} mt-1`} value={form.nim} onChange={set("nim")} required /></label>
            )}
            {form.role === "dosen" && <label className="text-sm font-semibold text-slate-700">NIDN<input className={`${field} mt-1`} value={form.nidn} onChange={set("nidn")} required /></label>}
            {(form.role === "dosen" || form.role === "orangtua") && (
              <label className="text-sm font-semibold text-slate-700">No WhatsApp<input className={`${field} mt-1`} value={form.no_wa} onChange={set("no_wa")} placeholder="081234567890" inputMode="tel" required /></label>
            )}
            <div className="sm:col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan..." : "Simpan akun"}</Button></div>
          </form>
        </Card>
      )}

      <div className="mb-6"><RosterImport /></div>

      <ul className="space-y-3 md:hidden" aria-label="Daftar pengguna">
        {isLoading && <li className="text-sm text-slate-500">Memuat data...</li>}
        {users.map((u) => (
          <li key={u.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{u.name}</p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
              </div>
              {u.is_active ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} />Aktif</span> : <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Nonaktif</span>}
            </div>
            <p className="mt-2 text-xs text-slate-500">{ROLE_LABEL[u.role] ?? u.role}{u.no_wa ? ` · ${u.no_wa}` : ""}</p>
            {u.role === "mahasiswa" && u.nim && (
              <select aria-label={`Dosen PA ${u.name}`} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={u.id_dosen_pa ?? ""} onChange={(e) => e.target.value && assign.mutate({ nim: u.nim!, id: Number(e.target.value) })}>
                <option value="">Dosen PA: belum ditugaskan</option>
                {dosenList.map((d) => <option key={d.id} value={d.id_dosen_pa ?? ""}>{d.name}</option>)}
              </select>
            )}
            <Button className="mt-3 w-full" size="sm" variant={u.is_active ? "danger" : "secondary"} onClick={() => toggle.mutate({ id: u.id, active: !u.is_active })}><UserRoundX size={14} className="mr-1" />{u.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
          </li>
        ))}
      </ul>

      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr><th className="p-3">Nama</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">No WA</th><th className="p-3">Dosen PA</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td className="p-3 text-slate-500" colSpan={7}>Memuat data...</td></tr>}
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3 font-semibold">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td className="p-3">{u.no_wa ?? "-"}</td>
                  <td className="p-3">
                    {u.role === "mahasiswa" && u.nim ? (
                      <select aria-label={`Dosen PA ${u.name}`} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" value={u.id_dosen_pa ?? ""} onChange={(e) => e.target.value && assign.mutate({ nim: u.nim!, id: Number(e.target.value) })}>
                        <option value="">Belum ditugaskan</option>
                        {dosenList.map((d) => <option key={d.id} value={d.id_dosen_pa ?? ""}>{d.name}</option>)}
                      </select>
                    ) : "-"}
                  </td>
                  <td className="p-3">{u.is_active ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} />Aktif</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Nonaktif</span>}</td>
                  <td className="p-3"><Button size="sm" variant={u.is_active ? "danger" : "secondary"} onClick={() => toggle.mutate({ id: u.id, active: !u.is_active })}><UserRoundX size={14} className="mr-1" />{u.is_active ? "Nonaktifkan" : "Aktifkan"}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
