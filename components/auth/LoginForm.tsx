"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiError, loginApi, loginGoogleApi, saveSession, type ApiUser, type LoginResult } from "@/lib/authApi";
import { useAuthConfig } from "@/hooks/useAuthConfig";
import GoogleButton from "@/components/auth/GoogleButton";
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
  const [notRegistered, setNotRegistered] = useState(false);
  const { data: config } = useAuthConfig();

  // Setelah daftar, email terisi otomatis lewat /login?email=...
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("email");
    if (preset) setEmail(preset);
  }, []);

  function finish(result: LoginResult) {
    // Token ada di cookie httpOnly (diatur server). Di sini hanya identitas non-rahasia untuk tampilan.
    saveSession(result, result.user.nim ?? "");
    router.push(destinations[result.user.role] ?? "/login");
  }

  async function googleLogin(credential: string) {
    setError(""); setUnverified(false); setNotRegistered(false); setLoading(true);
    try {
      finish(await loginGoogleApi(credential));
    } catch (e) {
      setLoading(false);
      if (e instanceof ApiError && e.code === "GOOGLE_BELUM_TERDAFTAR") return setNotRegistered(true);
      setError(e instanceof Error ? e.message : "Gagal masuk dengan Google. Coba lagi.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUnverified(false);
    setNotRegistered(false);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return setError("Email dan password wajib diisi.");

    setLoading(true);
    try {
      finish(await loginApi(normalizedEmail, password));
    } catch (e) {
      setLoading(false);
      if (e instanceof ApiError && e.code === "EMAIL_BELUM_TERVERIFIKASI") return setUnverified(true);
      setError(e instanceof Error ? e.message : "Gagal masuk. Coba lagi.");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium leading-5 text-red-700">{error}</div>}
      {unverified && <ResendVerification email={email.trim().toLowerCase()} className="mb-4" />}
      {notRegistered && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Akun Google ini belum terdaftar di sistem. <Link href="/register" className="font-bold underline">Daftar dulu</Link> memakai akun Google yang sama.
        </div>
      )}

      <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email</label>
      <div className="relative mb-4"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="field" placeholder="nama@gmail.com" required /></div>

      <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">Password</label>
      <div className="relative mb-6"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="field pr-12" required /><button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}><UserRound size={18} className="mr-2" />{loading ? "Memproses..." : "Masuk"}</Button>
      {config?.google_enabled && config.google_client_id && (
        <div className="mt-5">
          <div className="mb-4 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />atau<span className="h-px flex-1 bg-slate-200" /></div>
          <GoogleButton clientId={config.google_client_id} onCredential={googleLogin} text="signin_with" />
          <p className="mt-2 text-center text-xs text-slate-400">Hanya untuk akun yang sudah terdaftar.</p>
        </div>
      )}
      <p className="mt-4 text-center text-sm text-slate-500">Belum punya akun? <Link href="/register" className="font-bold text-blue-600 hover:underline">Daftar</Link></p>
      <p className="mt-2 text-center text-sm text-slate-500">Orang tua mahasiswa? <Link href="/login-ortu" className="font-bold text-blue-600 hover:underline">Masuk dengan NIM anak</Link></p>
    </form>
  );
}
