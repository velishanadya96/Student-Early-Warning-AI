import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";
import AuthShell from "@/components/auth/AuthShell";

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Verifikasi email" subtitle="Kami sedang memeriksa tautan verifikasi.">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Memuat...</p>}>
        <VerifyEmailClient />
      </Suspense>
    </AuthShell>
  );
}
