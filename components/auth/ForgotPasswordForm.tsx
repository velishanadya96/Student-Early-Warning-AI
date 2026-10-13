"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, forgotPassword } from "@/lib/authClient";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      setMessage(await forgotPassword(email.trim().toLowerCase()));
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Permintaan gagal. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      {message ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
          {message} Tautan berlaku 60 menit dan hanya bisa dipakai sekali. Cek juga folder spam.
        </div>
      ) : (
        <>
          {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
          <label htmlFor="forgot-email" className="mb-2 block text-sm font-bold text-slate-700">Email akun</label>
          <div className="relative mb-6">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="nama@student.uns.ac.id" autoComplete="email" required />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? "Mengirim..." : "Kirim tautan reset"}</Button>
        </>
      )}
      <p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-bold text-blue-600 hover:underline">Kembali ke halaman masuk</Link></p>
    </form>
  );
}
