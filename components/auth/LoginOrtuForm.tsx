"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiError, loginOrtuApi, saveSession } from "@/lib/authApi";
import ResendVerification from "@/components/auth/ResendVerification";


// Login Orang Tua: NIM anak + email anak + password milik orang tua.
export default function LoginOrtuForm() {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUnverified(false);
    const cleanNim = nim.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanNim || !cleanEmail || password.length < 6) {
      return setError("NIM, email mahasiswa, dan password wajib diisi. Password minimal 6 karakter.");
    }

    setLoading(true);
    try {
      const result = await loginOrtuApi(cleanNim, cleanEmail, password);
      saveSession(result, result.user.nim ?? cleanNim);
      router.push("/dashboard-orangtua");
    } catch (e) {
      if (e instanceof ApiError && e.code === "EMAIL_BELUM_TERVERIFIKASI") setUnverified(true);
      else setError(e instanceof Error ? e.message : "Login gagal. Coba lagi.");
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500";

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold text-slate-700">
        NIM mahasiswa (anak)
        <div className="relative mt-1">
          <UserRound className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input className={input} value={nim} onChange={(e) => setNim(e.target.value)} placeholder="2024001" inputMode="numeric" />
        </div>
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Email mahasiswa (anak)
        <div className="relative mt-1">
          <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@student.uns.ac.id" />
        </div>
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Password orang tua
        <div className="relative mt-1">
          <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input className={`${input} pr-11`} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-4 top-3.5 text-slate-400" aria-label="Tampilkan password">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {unverified && <ResendVerification email={email.trim().toLowerCase()} nim={nim.trim()} />}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Memproses..." : "Masuk sebagai Orang Tua"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Bukan orang tua? <Link href="/login" className="font-semibold text-blue-600">Masuk di sini</Link>
      </p>
    </form>
  );
}
