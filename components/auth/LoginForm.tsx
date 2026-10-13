"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, login, resendVerification } from "@/lib/authClient";
import { DEMO_ACCOUNTS } from "@/lib/demoAccounts";
import { ROLE_HOME, ROLE_LABELS, isRole, type UserRole } from "@/lib/roles";
import { SESSION_KEY } from "@/hooks/useSession";

const SSO_DOMAIN = "@student.uns.ac.id";

const roleOptions: Array<{ value: UserRole; description: string; requiresSso: boolean }> = [
  { value: "mahasiswa", description: "Masuk menggunakan akun SSO mahasiswa", requiresSso: true },
  { value: "dosen", description: "Akun internal UNS", requiresSso: true },
  { value: "kaprodi", description: "Akun internal UNS", requiresSso: true },
  { value: "admin", description: "Akun pengelola sistem", requiresSso: true },
  { value: "orangtua", description: "Akun pendamping mahasiswa", requiresSso: false },
];

export type DemoMode = { password?: string } | null;

export default function LoginForm({ initialEmail = "", demo = null }: { initialEmail?: string; demo?: DemoMode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<UserRole>("mahasiswa");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [info, setInfo] = useState("");

  // Datang dari halaman daftar: akun yang baru dibuat selalu Mahasiswa.
  useEffect(() => {
    if (initialEmail) setRole("mahasiswa");
  }, [initialEmail]);

  const selectedRole = useMemo(() => roleOptions.find((item) => item.value === role) ?? roleOptions[0], [role]);

  function changeRole(nextRole: UserRole) {
    setRole(nextRole);
    setDemoEmail("");
    setError("");
  }

  function pickDemoAccount(value: string) {
    setDemoEmail(value);
    setError("");
    const account = DEMO_ACCOUNTS.find((item) => item.email === value);
    if (!account) return;
    setRole(account.role);
    setEmail(account.email);
    setPassword(demo?.password ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setNeedsVerification(false);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6) return setError("Email dan password wajib diisi. Password minimal 6 karakter.");
    if (selectedRole?.requiresSso && !normalizedEmail.endsWith(SSO_DOMAIN)) return setError(`Gunakan email SSO dengan format nama${SSO_DOMAIN}.`);

    setSubmitting(true);
    try {
      const user = await login({ email: normalizedEmail, password, role });
      queryClient.clear();
      queryClient.setQueryData(SESSION_KEY, user);
      router.push(isRole(user.role) ? ROLE_HOME[user.role] : "/login");
      router.refresh();
    } catch (e) {
      const message = e instanceof ApiRequestError ? e.message : "Login gagal. Coba lagi.";
      setNeedsVerification(e instanceof ApiRequestError && e.code === "EMAIL_BELUM_TERVERIFIKASI");
      setError(e instanceof ApiRequestError && e.status === 401 ? `${message} Belum punya akun? Silakan daftar terlebih dahulu.` : message);
      setSubmitting(false);
    }
  }

  async function resend() {
    setInfo("");
    try {
      setInfo(await resendVerification(email.trim().toLowerCase()));
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Gagal mengirim ulang. Coba lagi.");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <div className="mb-7"><p className="text-sm font-extrabold text-blue-600">Selamat datang kembali</p><h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Masuk ke sistem</h2><p className="mt-2 text-sm leading-6 text-slate-500">Pilih jenis akun dari daftar di bawah, lalu masuk dengan email dan password.</p></div>

      {demo && (
        <>
        <label htmlFor="demo-account" className="mb-2 block text-sm font-bold text-slate-700">Akun demo <span className="font-medium text-slate-400">(opsional)</span></label>
        <select id="demo-account" value={demoEmail} onChange={(e) => pickDemoAccount(e.target.value)} className="mb-5 w-full appearance-none rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
          <option value="">Pilih akun demo untuk mengisi form otomatis</option>
          {DEMO_ACCOUNTS.map((account) => <option key={account.email} value={account.email}>{account.name} — {ROLE_LABELS[account.role]}{account.nim ? ` (${account.nim})` : ""}</option>)}
        </select>
          {!demo.password && <p className="-mt-3 mb-5 text-xs text-slate-500">Dropdown hanya mengisi email dan jenis akun. Ketik password yang kamu isi di <code>SEED_PASSWORD</code>.</p>}
        </>
      )}

      <label htmlFor="role" className="mb-2 block text-sm font-bold text-slate-700">Jenis akun</label>
      <div className="relative mb-5">
        <select id="role" value={role} onChange={(e) => changeRole(e.target.value as UserRole)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
          {roleOptions.map((option) => <option key={option.value} value={option.value}>{ROLE_LABELS[option.value]} — {option.description}</option>)}
        </select>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium leading-5 text-red-700">{error}{needsVerification && <button type="button" onClick={resend} className="mt-2 block font-bold underline">Kirim ulang verifikasi</button>}</div>}
      {info && <div role="status" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium leading-5 text-emerald-800">{info}</div>}

      <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email SSO</label>
      <div className="relative mb-2"><Mail className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="nama@student.uns.ac.id" autoComplete="username" required /></div>
      <p className="mb-4 text-xs text-slate-400">{selectedRole?.requiresSso ? `Wajib menggunakan domain ${SSO_DOMAIN}` : "Akun orang tua dibuat dan dikaitkan ke mahasiswa oleh administrator."}</p>

      <div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="block text-sm font-bold text-slate-700">Password</label><Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:underline">Lupa password?</Link></div>
      <div className="relative mb-6"><Lock className="absolute left-3 top-3.5 text-slate-400" size={18} /><input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-11 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" minLength={6} autoComplete="current-password" required /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-slate-400" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}><UserRound size={18} className="mr-2" />{submitting ? "Memproses..." : `Masuk sebagai ${ROLE_LABELS[role]}`}</Button>
      <p className="mt-4 text-center text-sm text-slate-500">Belum punya akun? <Link href="/register" className="font-bold text-blue-600 hover:underline">Daftar</Link></p>
    </form>
  );
}
