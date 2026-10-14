"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { resendVerificationApi } from "@/lib/authApi";

/** Kotak peringatan "email belum diverifikasi" + tombol kirim ulang tautan. */
export default function ResendVerification({ email, nim, className = "" }: { email: string; nim?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cooldown, setCooldown] = useState(false);

  async function resend() {
    setState("sending");
    try {
      await resendVerificationApi(email, nim);
      setState("sent");
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 30000);
    } catch {
      setState("error");
    }
  }

  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 ${className}`} role="status">
      <div className="flex items-start gap-2">
        <MailCheck size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Email belum diverifikasi.</p>
          <p className="mt-1 leading-5">Klik tautan di email {nim ? "orang tua (yang dipakai saat mendaftar)" : <b>{email}</b>}. Cek juga folder spam.</p>
          <button type="button" onClick={resend} disabled={state === "sending" || cooldown} className="mt-2 font-bold text-blue-700 underline disabled:opacity-50 disabled:no-underline">
            {state === "sending" ? "Mengirim..." : cooldown ? "Tautan baru sudah dikirim" : "Kirim ulang tautan verifikasi"}
          </button>
          {state === "error" && <p className="mt-1 text-red-700">Gagal mengirim. Coba lagi sebentar lagi.</p>}
        </div>
      </div>
    </div>
  );
}
