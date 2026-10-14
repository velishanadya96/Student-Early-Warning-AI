import RegisterOrtuForm from "@/components/auth/RegisterOrtuForm";

export default function RegisterOrtuPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Student Early Warning AI</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Daftar Orang Tua</h1>
            <p className="mt-2 text-sm text-slate-500">Verifikasi dengan NIM dan email mahasiswa (anak Anda).</p>
          </div>
          <RegisterOrtuForm />
        </div>
      </div>
    </main>
  );
}
