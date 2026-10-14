"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiError, loginApi, saveSession, type ApiUser } from "@/lib/authApi";
import ResendVerification from "@/components/auth/ResendVerification";

const destinations: Record<ApiUser["role"], string> = {
  admin: "/dashboard-admin",
  dosen: "/dashboard",
  kaprodi: "/dashboard-kaprodi",
  mahasiswa: "/dashboard-mahasiswa",
  orangtua: "/dashboard-orangtua",
};

// Satu form untuk semua role: server yang menentukan role akun, lalu pengguna diarahkan ke dashboard-nya.
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Setelah daftar, email terisi otomatis lewat /login?email=...
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("email");
    if (preset) setEmail(preset);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUnverified(false);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6) return setError("Email dan password wajib diisi. Password minimal 6 karakter.");

    setLoading(true);
    try {
      const result = await loginApi(normalizedEmail, password);
      // Token ada di cookie httpOnly (diatur server). Di sini hanya identitas non-rahasia untuk tampilan.
      saveSession(result, result.user.nim ?? "");
      router.push(destinations[result.user.role] ?? "/login");
    } catch (e) {
      setLoading(false);
      if (e instanceof ApiError && e.code === "EMAIL_BELUM_TERVERIFIKASI") return setUnverified(true);
      setError(e instanceof Error ? e.message : "Login gagal.");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <div className="mb-7">
        <p className="text-sm font-extrabold text-blue-600">Selamat datang kembali</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Masuk ke sistem</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Mahasiswa, Dosen PA, Kaprodi, dan Admin masuk dengan email dan password. Orang tua masuk dengan NIM anak.</p>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium leading-5 text-red-700">{error}</div>}
      {unverified && <ResendVerification email={email.trim().toLowerCase()} className="mb-4" />}

      <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email</label>
      <div className="relative mb-4"><Mail className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="nama@student.uns.ac.id" required /></div>

      <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">Password</label>
      <div className="relative mb-6"><Lock className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-11 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" minLength={6} required /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-slate-400" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}><UserRound size={18} className="mr-2" />{loading ? "Memproses..." : "Masuk"}</Button>
      <p className="mt-4 text-center text-sm text-slate-500">Belum punya akun? <Link href="/register" className="font-bold text-blue-600 hover:underline">Daftar</Link></p>
      <p className="mt-2 text-center text-sm text-slate-500">Orang tua mahasiswa? <Link href="/login-ortu" className="font-bold text-blue-600 hover:underline">Masuk dengan NIM anak</Link></p>
    </form>
  );
}
