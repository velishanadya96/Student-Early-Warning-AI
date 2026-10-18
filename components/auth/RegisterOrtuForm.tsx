"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { registerOrtuApi } from "@/lib/authApi";
import ResendVerification from "@/components/auth/ResendVerification";

/** Pendaftaran mandiri Orang Tua, diverifikasi dengan NIM + email anak. No WhatsApp dipakai untuk notifikasi (FR-11). */
export default function RegisterOrtuForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", no_wa: "", password: "", confirmation: "", nim: "", email_mahasiswa: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [needVerify, setNeedVerify] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [key]: e.target.value });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (f.name.trim().length < 3) return setError("Nama lengkap minimal 3 karakter.");
    if (!/^[0-9 +()-]{9,20}$/.test(f.no_wa.trim())) return setError("Nomor WhatsApp tidak valid. Contoh: 081234567890.");
    if (f.password.length < 8) return setError("Password minimal 8 karakter.");
    if (f.password !== f.confirmation) return setError("Konfirmasi password belum sama.");
    if (!f.nim.trim() || !f.email_mahasiswa.trim()) return setError("NIM dan email mahasiswa wajib diisi.");

    setSubmitting(true);
    try {
      const res = await registerOrtuApi({
        name: f.name.trim(), email: f.email.trim().toLowerCase(), password: f.password, no_wa: f.no_wa.trim(),
        nim: f.nim.trim(), email_mahasiswa: f.email_mahasiswa.trim().toLowerCase(),
      });
      setSuccess(true);
      if (res.verification_required) setNeedVerify(true);
      else timer.current = window.setTimeout(() => router.push("/login-ortu"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pendaftaran gagal. Coba lagi.");
      setSubmitting(false);
    }
  }

  const field = "field";
  const label = "mb-2 block text-sm font-bold text-slate-700";

  if (success) {
    return (
      <div role="status" className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={19} /> Akun orang tua berhasil dibuat</div>
        {needVerify ? (
          <>
            <p className="mt-2 leading-6">Kami mengirim tautan verifikasi ke <b>{f.email.trim().toLowerCase()}</b>. Klik tautan itu (berlaku 24 jam), lalu <Link href="/login-ortu" className="font-bold underline">masuk</Link>. Cek juga folder spam.</p>
            <ResendVerification email={f.email_mahasiswa.trim().toLowerCase()} nim={f.nim.trim()} className="mt-3" />
          </>
        ) : (
          <p className="mt-2 leading-6">Anda akan diarahkan ke halaman <Link href="/login-ortu" className="font-bold underline">masuk</Link>.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <label htmlFor="ro-name" className={label}>Nama lengkap orang tua</label>
      <div className="relative mb-4"><UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="ro-name" value={f.name} onChange={set("name")} className={field} autoComplete="name" required /></div>

      <label htmlFor="ro-email" className={label}>Email orang tua</label>
      <div className="relative mb-4"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="ro-email" type="email" value={f.email} onChange={set("email")} className={field} placeholder="nama@gmail.com" autoComplete="email" required /></div>

      <label htmlFor="ro-wa" className={label}>Nomor WhatsApp (untuk notifikasi)</label>
      <div className="relative mb-4"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="ro-wa" value={f.no_wa} onChange={set("no_wa")} className={field} placeholder="081234567890" inputMode="tel" required /></div>

      <label htmlFor="ro-pass" className={label}>Password (min. 8 karakter)</label>
      <div className="relative mb-4"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="ro-pass" type={show ? "text" : "password"} value={f.password} onChange={set("password")} className={`${field} pr-11`} minLength={8} autoComplete="new-password" required /><button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

      <label htmlFor="ro-conf" className={label}>Konfirmasi password</label>
      <div className="relative mb-6"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="ro-conf" type={show ? "text" : "password"} value={f.confirmation} onChange={set("confirmation")} className={field} minLength={8} autoComplete="new-password" required /></div>

      <p className="mb-3 border-t border-slate-100 pt-4 text-xs text-slate-400">Verifikasi anak: NIM dan email harus cocok dengan data mahasiswa di sistem. Satu mahasiswa hanya bisa punya satu akun orang tua.</p>
      <label htmlFor="ro-nim" className={label}>NIM mahasiswa (anak)</label>
      <div className="relative mb-4"><UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="ro-nim" value={f.nim} onChange={set("nim")} className={field} placeholder="V3924001" required /></div>

      <label htmlFor="ro-em" className={label}>Email mahasiswa (anak)</label>
      <div className="relative mb-6"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="ro-em" type="email" value={f.email_mahasiswa} onChange={set("email_mahasiswa")} className={field} placeholder="nama@gmail.com" required /></div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? "Memproses..." : "Daftar sebagai orang tua"}</Button>
      <p className="mt-6 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/login-ortu" className="font-bold text-blue-600 hover:underline">Masuk</Link></p>
    </form>
  );
}
