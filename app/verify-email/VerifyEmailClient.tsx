"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailApi } from "@/lib/authApi";

export default function VerifyEmailClient() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Tautan verifikasi tidak lengkap.");
  const started = useRef(false); // cegah dobel panggilan (token sekali pakai) di mode dev React

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmailApi(token)
      .then((r) => { setState("ok"); setMessage(r.message); })
      .catch((e) => { setState("error"); setMessage(e instanceof Error ? e.message : "Verifikasi gagal."); });
  }, [token]);

  if (state === "loading") return <p className="mt-6 text-center text-sm text-slate-500">Memverifikasi email...</p>;
  const ok = state === "ok";
  return (
    <div className={`mt-6 rounded-2xl border p-5 text-sm ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="status">
      <div className="flex items-center gap-2 font-bold">{ok ? <CheckCircle2 size={19} /> : <XCircle size={19} />}{ok ? "Email terverifikasi" : "Verifikasi gagal"}</div>
      <p className="mt-2 leading-6">{message}</p>
      <Link href="/login" className="mt-3 inline-block font-bold underline">{ok ? "Masuk sekarang" : "Ke halaman masuk (bisa minta tautan baru di sana)"}</Link>
    </div>
  );
}
