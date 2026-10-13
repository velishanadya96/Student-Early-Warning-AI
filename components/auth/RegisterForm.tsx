"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, UserRound, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, registerStudent } from "@/lib/authClient";

const SSO_DOMAIN = "@student.uns.ac.id";

/**
 * Pendaftaran mandiri hanya untuk Mahasiswa. Akun Dosen PA, Kaprodi, Admin, dan
 * Orang Tua dibuat oleh Administrator lewat menu Manajemen Pengguna.
 */
export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const redirectTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(redirectTimer.current), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalized = email.trim().toLowerCase();
    const trimmedNim = nim.trim();
    if (name.trim().length < 3) return setError("Nama lengkap minimal 3 karakter.");
    if (!/^\d{6,}$/.test(trimmedNim)) return setError("NIM wajib diisi, hanya angka, minimal 6 digit.");
    if (!normalized.endsWith(SSO_DOMAIN)) return setError(`Email harus menggunakan format nama${SSO_DOMAIN}.`);
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmation) return setError("Konfirmasi password belum sama.");

    setSubmitting(true);
    let needsVerification = false;
    try {
      const created = await registerStudent({ name: name.trim(), email: normalized, password, nim: trimmedNim });
      needsVerification = created.verification_required === true;
      setVerificationRequired(needsVerification);
    } catch (e) {
      setSubmitting(false);
      return setError(e instanceof ApiRequestError ? e.message : "Pendaftaran gagal. Coba lagi.");
    }
    setSuccess(true);
    // Kalau email harus diverifikasi, tetap di halaman ini supaya pesan "cek email" terbaca.
    if (!needsVerification) redirectTimer.current = window.setTimeout(() => router.push(`/login?email=${encodeURIComponent(normalized)}`), 900);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <div className="mb-7"><p className="text-sm font-extrabold text-blue-600">Buat akun</p><h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Daftar akun SSO</h2><p className="mt-2 text-sm leading-6 text-slate-500">Pendaftaran mandiri khusus mahasiswa dengan email <b>{SSO_DOMAIN}</b>. Akun Dosen PA, Kaprodi, dan Admin dibuat oleh administrator.</p></div>

      {success ? <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"><div className="flex items-center gap-2 font-bold"><CheckCircle2 size={19} /> Akun berhasil dibuat.</div>{verificationRequired ? <p className="mt-2 leading-6">Kami mengirim tautan verifikasi ke <b>{email.trim().toLowerCase()}</b>. Klik tautan itu (berlaku 24 jam), lalu <Link href="/login" className="font-bold underline">masuk</Link>. Cek juga folder spam.</p> : <p className="mt-2 leading-6">Kamu akan diarahkan ke halaman login.</p>}</div> : <>
        <label htmlFor="register-name" className="mb-2 block text-sm font-bold text-slate-700">Nama lengkap</label>
        <div className="relative mb-4"><UserRound className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="register-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Nama lengkap" autoComplete="name" required /></div>

        <label htmlFor="register-nim" className="mb-2 block text-sm font-bold text-slate-700">NIM</label>
        <div className="relative mb-2"><UserRound className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="register-nim" value={nim} onChange={(e) => setNim(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="2024006" inputMode="numeric" required /></div>
        <p className="mb-4 text-xs text-slate-400">NIM dipakai untuk menghubungkan akun dengan data akademik di sistem. Satu NIM hanya bisa dipakai satu akun.</p>

        <label htmlFor="register-email" className="mb-2 block text-sm font-bold text-slate-700">Email SSO</label>
        <div className="relative mb-4"><Mail className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder={`nama${SSO_DOMAIN}`} autoComplete="email" required /></div>

        <label htmlFor="register-password" className="mb-2 block text-sm font-bold text-slate-700">Password SSO</label>
        <div className="relative mb-4"><Lock className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="register-password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-11 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" minLength={8} autoComplete="new-password" required /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-slate-400" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

        <label htmlFor="register-confirm" className="mb-2 block text-sm font-bold text-slate-700">Konfirmasi password</label>
        <div className="relative mb-6"><Lock className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="register-confirm" type={show ? "text" : "password"} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" minLength={8} autoComplete="new-password" required /></div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? "Memproses..." : "Daftar akun"}</Button>
      </>}

      <p className="mt-6 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/login" className="font-bold text-blue-600 hover:underline">Masuk</Link></p>
    </form>
  );
}
