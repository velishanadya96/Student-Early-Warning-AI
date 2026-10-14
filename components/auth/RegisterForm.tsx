"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, UserRound, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { registerApi } from "@/lib/authApi";
import ResendVerification from "@/components/auth/ResendVerification";

const SSO_DOMAIN = "@student.uns.ac.id";
type RegisterRole = "mahasiswa" | "dosen" | "kaprodi" | "admin";

const roleLabels: Record<RegisterRole, string> = {
  mahasiswa: "Mahasiswa",
  dosen: "Dosen PA / Staff",
  kaprodi: "Kaprodi",
  admin: "Admin / Staff",
};

export default function RegisterForm() {
  const router = useRouter();
  const role: RegisterRole = "mahasiswa";
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [needVerify, setNeedVerify] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalized = email.trim().toLowerCase();
    
    if (name.trim().length < 3) return setError("Nama lengkap minimal 3 karakter.");
    if (!normalized.endsWith(SSO_DOMAIN)) return setError(`Email harus menggunakan format nama${SSO_DOMAIN}.`);
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmation) return setError("Konfirmasi password belum sama.");
    
    const trimmedNim = nim.trim();
    if (role === "mahasiswa" && trimmedNim.length < 6) return setError("NIM wajib diisi, minimal 6 karakter.");
    
    setLoading(true);
    let verifyRequired = false;
    try {
      const res = await registerApi({ name: name.trim(), email: normalized, password, nim: trimmedNim });
      verifyRequired = Boolean(res.verification_required);
      setNeedVerify(verifyRequired);
      setSentTo(normalized);
    } catch (e) {
      setLoading(false);
      return setError(e instanceof Error ? e.message : "Pendaftaran gagal.");
    }
    setLoading(false);
    setSuccess(true);
    // Kalau verifikasi email dimatikan di backend, akun langsung aktif -> arahkan ke login.
    if (!verifyRequired) window.setTimeout(() => router.push(`/login?email=${encodeURIComponent(normalized)}`), 900);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <div className="mb-7">
        <p className="text-sm font-extrabold text-blue-600">Buat akun</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Daftar akun SSO</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Pendaftaran mandiri untuk mahasiswa dengan email <b>@student.uns.ac.id</b>. Akun dosen, kaprodi, dan admin dibuat oleh Admin.
        </p>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 size={19} /> Pendaftaran berhasil.
          </div>
          {needVerify ? (
            <>
              <p className="mt-2 leading-6">Akun tersimpan. Kami mengirim tautan verifikasi ke <b>{sentTo}</b>. Klik tautan itu (berlaku 24 jam), lalu <Link href="/login" className="font-bold underline">masuk</Link>. Cek juga folder spam.</p>
              <ResendVerification email={sentTo} className="mt-3" />
            </>
          ) : (
            <p className="mt-2 leading-6">Akun tersimpan di database. Kamu akan diarahkan ke halaman login.</p>
          )}
        </div>
      ) : (
        <>
          <label htmlFor="register-name" className="mb-2 block text-sm font-bold text-slate-700">Nama lengkap</label>
          <div className="relative mb-4">
            <UserRound className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              id="register-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
              placeholder="Nama lengkap" 
              required 
            />
          </div>

          {role === "mahasiswa" && (
            <>
              <label htmlFor="register-nim" className="mb-2 block text-sm font-bold text-slate-700">NIM</label>
              <div className="relative mb-2">
                <UserRound className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  id="register-nim" 
                  value={nim} 
                  onChange={(e) => setNim(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
                  placeholder="V3925047" 
                  required 
                />
              </div>
              <p className="mb-4 text-xs text-slate-400">NIM dipakai untuk menghubungkan akun dengan data akademik di sistem.</p>
            </>
          )}

          <label htmlFor="register-email" className="mb-2 block text-sm font-bold text-slate-700">Email SSO</label>
          <div className="relative mb-2">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              id="register-email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
              placeholder="nama@student.uns.ac.id" 
              required 
            />
          </div>
          <p className="mb-4 text-xs text-slate-400">Role {roleLabels[role]} menggunakan domain {SSO_DOMAIN}.</p>

          <label htmlFor="register-password" className="mb-2 block text-sm font-bold text-slate-700">Password SSO</label>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              id="register-password" 
              type={show ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-11 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
              minLength={8} 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShow(!show)} 
              className="absolute right-3 top-3.5 text-slate-400" 
              aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label htmlFor="register-confirm" className="mb-2 block text-sm font-bold text-slate-700">Konfirmasi password</label>
          <div className="relative mb-6">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              id="register-confirm" 
              type="password" 
              value={confirmation} 
              onChange={(e) => setConfirmation(e.target.value)} 
              className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
              minLength={8} 
              required 
            />
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
          
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Daftar akun"}
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Sudah punya akun? <Link href="/login" className="font-bold text-blue-600 hover:underline">Masuk</Link>
      </p>
    </form>
  );
}