"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, UserRound, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ApiError, googlePreviewApi, registerApi, type GooglePreview } from "@/lib/authApi";
import { useAuthConfig } from "@/hooks/useAuthConfig";
import GoogleButton from "@/components/auth/GoogleButton";
import ResendVerification from "@/components/auth/ResendVerification";

const field = "field";
const label = "mb-2 block text-sm font-bold text-slate-700";

// Pendaftaran mahasiswa.
//  - Google aktif  : langkah 1 pilih akun Google (diverifikasi server) -> langkah 2 lengkapi NIM + password.
//  - Google nonaktif: form email + password, lalu verifikasi lewat tautan di email.
export default function RegisterForm() {
  const router = useRouter();
  const { data: config, isLoading: configLoading } = useAuthConfig();
  const google = Boolean(config?.google_enabled && config.google_client_id);

  const [credential, setCredential] = useState("");
  const [info, setInfo] = useState<GooglePreview | null>(null);
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ email: string; verify: boolean } | null>(null);

  async function onGoogle(cred: string) {
    setError(""); setLoading(true);
    try {
      const p = await googlePreviewApi(cred);
      if (p.already_registered) return setError("Akun Google ini sudah terdaftar. Silakan masuk.");
      if (p.domain_error) return setError(p.domain_error);
      setCredential(cred); setInfo(p);
      setName(p.nama_resmi ?? p.name); setNim(p.nim ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verifikasi Google gagal.");
    } finally {
      setLoading(false);
    }
  }

  function resetGoogle() { setCredential(""); setInfo(null); setError(""); setPassword(""); setConfirmation(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedNim = nim.trim();
    if (name.trim().length < 3) return setError("Nama lengkap minimal 3 karakter.");
    if (trimmedNim.length < 6) return setError("NIM wajib diisi, minimal 6 karakter.");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmation) return setError("Konfirmasi password belum sama.");
    const normalized = (google ? info?.email : email.trim().toLowerCase()) ?? "";
    if (!google) {
      const doms = config?.allowed_email_domains ?? [];
      if (doms.length && !doms.includes(normalized.split("@")[1] ?? "")) return setError(`Email harus memakai domain: ${doms.map((d) => "@" + d).join(", ")}.`);
    }

    setLoading(true);
    try {
      const res = await registerApi(google
        ? { credential, name: name.trim(), nim: trimmedNim, password }
        : { name: name.trim(), email: normalized, nim: trimmedNim, password });
      setDone({ email: normalized, verify: Boolean(res.verification_required) });
      if (!res.verification_required) window.setTimeout(() => router.push(`/login?email=${encodeURIComponent(normalized)}`), 1500);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && google) { resetGoogle(); return setError("Sesi Google kedaluwarsa. Pilih akun Google lagi."); }
      setError(e instanceof Error ? e.message : "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md">
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={19} /> Pendaftaran berhasil.</div>
          {done.verify ? (
            <>
              <p className="mt-2 leading-6">Akun tersimpan. Kami mengirim tautan verifikasi ke <b>{done.email}</b>. Klik tautan itu (berlaku 24 jam), lalu <Link href="/login" className="font-bold underline">masuk</Link>. Cek juga folder spam.</p>
              <ResendVerification compact email={done.email} className="mt-3" />
            </>
          ) : (
            <p className="mt-2 leading-6">Akun <b>{done.email}</b> sudah aktif. Kamu akan diarahkan ke halaman <Link href="/login" className="font-bold underline">masuk</Link>.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <p className="mb-6 text-sm leading-6 text-slate-500">
        {google ? "Hanya akun Google yang valid yang bisa mendaftar." : "Pendaftaran mandiri khusus mahasiswa. Akun dosen, kaprodi, dan admin dibuat oleh Admin."}
      </p>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
      {configLoading && <p className="mb-4 text-sm text-slate-500">Memuat...</p>}

      {google && !info && (
        <div className="mb-2">
          <GoogleButton clientId={config!.google_client_id!} onCredential={onGoogle} text="signup_with" />
          {loading && <p className="mt-3 text-center text-sm text-slate-500">Memverifikasi akun Google...</p>}
          <p className="mt-4 text-center text-xs text-slate-400">Email kamu diambil dari akun Google, jadi tidak perlu verifikasi lewat email lagi.</p>
        </div>
      )}

      {((google && info) || (!google && !configLoading)) && (
        <>
          {google && info && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Akun Google</p>
              <p className="mt-1 font-semibold text-slate-900">{info.email}</p>
              <button type="button" onClick={resetGoogle} className="mt-1 text-xs font-bold text-blue-700 underline">Pakai akun Google lain</button>
            </div>
          )}

          <label htmlFor="register-name" className={label}>Nama lengkap</label>
          <div className="relative mb-4">
            <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input id="register-name" value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Nama lengkap" disabled={Boolean(info?.nama_resmi)} required />
          </div>
          {info?.nama_resmi && <p className="-mt-3 mb-4 text-xs text-slate-400">Nama diambil dari data mahasiswa resmi.</p>}

          <label htmlFor="register-nim" className={label}>NIM</label>
          <div className="relative mb-2">
            <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input id="register-nim" value={nim} onChange={(e) => setNim(e.target.value)} className={field} placeholder="V3925047" disabled={Boolean(info?.nim)} required />
          </div>
          <p className="mb-4 text-xs text-slate-400">NIM dipakai untuk menghubungkan akun dengan data akademik di sistem.</p>

          {!google && (
            <>
              <label htmlFor="register-email" className={label}>Email</label>
              <div className="relative mb-4">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="nama@email.com" required />
              </div>
            </>
          )}

          <label htmlFor="register-password" className={label}>Password (untuk masuk dengan email)</label>
          <div className="relative mb-4">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input id="register-password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} pr-11`} minLength={8} autoComplete="new-password" required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label htmlFor="register-confirm" className={label}>Konfirmasi password</label>
          <div className="relative mb-6">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input id="register-confirm" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={field} minLength={8} autoComplete="new-password" required />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Memproses..." : "Daftar akun"}</Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Sudah punya akun? <Link href="/login" className="font-bold text-blue-600 hover:underline">Masuk</Link>
      </p>
    </form>
  );
}
