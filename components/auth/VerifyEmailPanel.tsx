"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { ApiRequestError, verifyEmail } from "@/lib/authClient";

type State = { status: "loading" } | { status: "success" } | { status: "error"; message: string };

export default function VerifyEmailPanel({ token }: { token: string }) {
  const [state, setState] = useState<State>(token ? { status: "loading" } : { status: "error", message: "Tautan verifikasi tidak lengkap." });
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // token sekali baca; cegah dua kali kirim
    verifyEmail(token)
      .then(() => setState({ status: "success" }))
      .catch((e) => setState({ status: "error", message: e instanceof ApiRequestError ? e.message : "Verifikasi gagal. Coba lagi." }));
  }, [token]);

  if (state.status === "loading") {
    return <p role="status" className="flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Memverifikasi email...</p>;
  }
  if (state.status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
        <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={19} /> Email berhasil diverifikasi.</div>
        <p className="mt-2">Akun kamu aktif. Silakan <Link href="/login" className="font-bold underline">masuk</Link>.</p>
      </div>
    );
  }
  return (
    <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm leading-6 text-red-700">
      <div className="flex items-center gap-2 font-bold"><XCircle size={19} /> {state.message}</div>
      <p className="mt-2">Masuk dengan akun kamu, lalu pilih <b>Kirim ulang verifikasi</b> untuk mendapat tautan baru. <Link href="/login" className="font-bold underline">Ke halaman masuk</Link></p>
    </div>
  );
}
