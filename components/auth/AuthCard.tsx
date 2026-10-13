export default function AuthCard({ title, subtitle, children }: Readonly<{ title: string; subtitle: string; children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Student Early Warning AI</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
