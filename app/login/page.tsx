import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Student Early Warning AI
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Masuk ke Sistem
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Masuk dengan email dan password, atau dengan akun Google yang sudah terdaftar.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}