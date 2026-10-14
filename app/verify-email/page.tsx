import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-blue-600">Student Early Warning AI</p>
          <h1 className="mt-2 text-center text-2xl font-black text-slate-950">Verifikasi email</h1>
          <Suspense fallback={<p className="mt-6 text-center text-sm text-slate-500">Memuat...</p>}>
            <VerifyEmailClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
