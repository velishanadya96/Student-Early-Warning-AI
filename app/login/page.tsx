import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk | Student Early Warning AI",
  description: "Masuk ke dashboard Student Early Warning AI sesuai role akun.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ email?: string | string[] }> }) {
  const { email } = await searchParams;
  const initialEmail = typeof email === "string" ? email : "";

  // Mode demo: dropdown akun demo + (opsional) password demo. HANYA untuk lokal; jangan aktifkan di server publik,
  // karena password demo ikut terkirim ke browser. Docker demo mengisinya, docker-compose.prod.yml tidak.
  const demo = process.env.DEMO_MODE === "1" ? { password: process.env.DEMO_PASSWORD || undefined } : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Student Early Warning AI</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Masuk ke Sistem</h1>
            <p className="mt-2 text-sm text-slate-500">Gunakan akun sesuai dengan role kamu.</p>
          </div>

          <LoginForm initialEmail={initialEmail} demo={demo} />
        </div>
      </div>
    </main>
  );
}
