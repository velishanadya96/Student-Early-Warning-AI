"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, resetPassword } from "@/lib/authClient";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm leading-6 text-red-700">
        Tautan reset tidak lengkap. Minta tautan baru di <Link href="/forgot-password" className="font-bold underline">halaman lupa password</Link>.
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmation) return setError("Konfirmasi password belum sama.");
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Reset password gagal. Coba lagi.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
        <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={19} /> Password berhasil diganti.</div>
        <p className="mt-2">Silakan <Link href="/login" className="font-bold underline">masuk</Link> dengan password baru.</p>
      </div>
    );
  }

  const field = "w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
      <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-slate-700">Password baru</label>
      <div className="relative mb-4"><Lock className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} minLength={8} autoComplete="new-password" required /></div>
      <label htmlFor="new-password-confirm" className="mb-2 block text-sm font-bold text-slate-700">Konfirmasi password baru</label>
      <div className="relative mb-6"><Lock className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="new-password-confirm" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={field} minLength={8} autoComplete="new-password" required /></div>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan password baru"}</Button>
    </form>
  );
}
