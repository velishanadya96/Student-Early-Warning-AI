"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, UserPlus, UserRoundX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, createUser, fetchUsers, setUserActive, type NewUserInput, type SessionUser } from "@/lib/authClient";
import { ROLES, ROLE_LABELS, type UserRole } from "@/lib/roles";

const SSO_DOMAIN = "@student.uns.ac.id";
const USERS_KEY = ["users"] as const;

const emptyForm = { name: "", email: "", role: "dosen" as UserRole, nim: "", nidn: "", password: "" };

function errorText(error: unknown): string {
  return error instanceof ApiRequestError ? error.message : "Terjadi kesalahan. Coba lagi.";
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: USERS_KEY, queryFn: fetchUsers, staleTime: 15_000 });
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const create = useMutation({
    mutationFn: (input: NewUserInput) => createUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_KEY });
      setForm(emptyForm);
      setShowForm(false);
      setMessage({ type: "success", text: "Pengguna berhasil ditambahkan." });
    },
    onError: (error) => setMessage({ type: "error", text: errorText(error) }),
  });

  const toggle = useMutation({
    mutationFn: (user: SessionUser) => setUserActive(user.id, !user.is_active),
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: USERS_KEY });
      setMessage({ type: "success", text: `Akun ${user.name} ${user.is_active ? "diaktifkan" : "dinonaktifkan"}.` });
    },
    onError: (error) => setMessage({ type: "error", text: errorText(error) }),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const email = form.email.trim().toLowerCase();
    if (form.name.trim().length < 3) return setMessage({ type: "error", text: "Nama minimal 3 karakter." });
    if (form.role !== "orangtua" && !email.endsWith(SSO_DOMAIN)) return setMessage({ type: "error", text: `Email ${ROLE_LABELS[form.role]} harus berakhiran ${SSO_DOMAIN}.` });
    if ((form.role === "mahasiswa" || form.role === "orangtua") && !/^\d{6,}$/.test(form.nim.trim())) return setMessage({ type: "error", text: "NIM wajib diisi, hanya angka, minimal 6 digit." });
    if (form.role === "dosen" && !form.nidn.trim()) return setMessage({ type: "error", text: "NIDN wajib diisi untuk Dosen PA." });
    if (form.password.length < 8) return setMessage({ type: "error", text: "Password minimal 8 karakter." });

    create.mutate({
      name: form.name.trim(),
      email,
      password: form.password,
      role: form.role,
      nim: form.role === "mahasiswa" || form.role === "orangtua" ? form.nim.trim() : undefined,
      nidn: form.role === "dosen" ? form.nidn.trim() : undefined,
    });
  }

  const input = "mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-normal outline-none focus:border-blue-500";

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Administrator</p>
          <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">FR-12: tambah akun, aktifkan, dan nonaktifkan pengguna. Data tersimpan di database backend.</p>
        </div>
        <Button onClick={() => setShowForm((open) => !open)}><UserPlus size={17} className="mr-2" />{showForm ? "Tutup Form" : "Tambah Pengguna"}</Button>
      </div>

      {message && <div role={message.type === "success" ? "status" : "alert"} className={`mb-4 rounded-xl p-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</div>}

      {showForm && (
        <Card className="mb-5">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Nama<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} required /></label>
            <label className="text-sm font-semibold">Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className={input}>
                {ROLES.map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} required /></label>
            {(form.role === "mahasiswa" || form.role === "orangtua") && (
              <label className="text-sm font-semibold">{form.role === "orangtua" ? "NIM mahasiswa yang dipantau" : "NIM"}
                <input value={form.nim} onChange={(e) => setForm({ ...form, nim: e.target.value })} inputMode="numeric" className={input} required />
              </label>
            )}
            {form.role === "dosen" && <label className="text-sm font-semibold">NIDN<input value={form.nidn} onChange={(e) => setForm({ ...form, nidn: e.target.value })} className={input} required /></label>}
            <label className="text-sm font-semibold">Password awal<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} autoComplete="new-password" className={input} required /></label>
            <div className="flex items-end"><Button type="submit" disabled={create.isPending}>{create.isPending ? "Menyimpan..." : "Simpan Pengguna"}</Button></div>
          </form>
        </Card>
      )}

      <Card>
        {users.isLoading && <div className="space-y-3" aria-live="polite">{[1, 2, 3].map((x) => <div key={x} className="skeleton h-12 rounded-lg" />)}</div>}
        {users.isError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{errorText(users.error)} <Button size="sm" variant="secondary" onClick={() => users.refetch()}>Coba lagi</Button></div>}
        {users.data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr><th className="p-3">Nama</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">NIM</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr>
              </thead>
              <tbody>
                {users.data.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-3 font-semibold">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{ROLE_LABELS[user.role] ?? user.role}</td>
                    <td className="p-3">{user.nim ?? "-"}</td>
                    <td className="p-3">
                      {user.is_active
                        ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} />Aktif</span>
                        : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Nonaktif</span>}
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant={user.is_active ? "danger" : "secondary"} disabled={toggle.isPending} onClick={() => toggle.mutate(user)}>
                        <UserRoundX size={14} className="mr-1" />{user.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
