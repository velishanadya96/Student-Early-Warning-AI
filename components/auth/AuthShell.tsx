import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Radar } from "@/components/ui/Radar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const DEMO = ["high", "medium", "low", "low", "medium", "low", "high", "low", "low", "medium", "low", "low"] as const;

/** Kerangka halaman masuk/daftar: panel merek (radar) di kiri, formulir di kanan. Satu kolom di HP. */
type Switch = { mode: "login" | "register"; role: "staf" | "ortu" };

/** Pilihan "Mahasiswa & staf" | "Orang tua": berpindah antara halaman masuk (atau daftar) yang sesuai. */
function RoleSwitch({ mode, role }: Switch) {
  const base = mode === "login" ? "/login" : "/register";
  return (
    <nav className="seg mb-6" aria-label="Jenis akun">
      <Link href={base} aria-current={role === "staf" ? "page" : undefined}>{mode === "login" ? "Mahasiswa & staf" : "Mahasiswa"}</Link>
      <Link href={`${base}-ortu`} aria-current={role === "ortu" ? "page" : undefined}>Orang tua</Link>
    </nav>
  );
}

export default function AuthShell({ title, subtitle, children, wide = false, roleSwitch }: { title: string; subtitle: string; children: React.ReactNode; wide?: boolean; roleSwitch?: Switch }) {
  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl gap-4 sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_1fr]">
        <aside className="hero relative hidden flex-col gap-12 p-9 lg:flex">
          <Link href="/" className="relative z-[1] flex items-center gap-3 font-extrabold" aria-label="Student Early Warning AI">
            <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "var(--hero-btn-bg)", color: "var(--hero-btn-fg)" }}><GraduationCap size={22} /></span>
            <span className="leading-tight"><span className="block text-sm">Student Early</span><span className="hero-muted block text-xs font-semibold">Warning AI</span></span>
          </Link>
          <div className="relative z-[1] max-w-sm">
            <h2 className="text-5xl font-extrabold leading-[1.05] tracking-tight">Kenali risiko <span className="hero-accent">sebelum terlambat.</span></h2>
            <p className="hero-muted mt-4 text-sm leading-6">Pantau kondisi akademik, baca penyebab risikonya, dan hubungi orang tua lewat WhatsApp pada saat yang tepat.</p>
          </div>
          <div className="pointer-events-none absolute -bottom-28 -right-24 w-[68%]"><Radar levels={[...DEMO]} /></div>
        </aside>

        <div className="flex flex-col">
          <div className="mb-3 flex items-center justify-between lg:justify-end">
            <Link href="/" className="flex items-center gap-2 font-extrabold lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--rail-bg)", color: "var(--rail-on-bg)" }}><GraduationCap size={18} /></span><span className="text-sm">Early Warning AI</span></Link>
            <ThemeToggle />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className={`card w-full ${wide ? "max-w-xl" : "max-w-lg"} p-7 sm:p-9`}>
              {roleSwitch && <RoleSwitch {...roleSwitch} />}
              <div className="mb-7">
                <p className="text-sm font-bold text-blue-600">Student Early Warning AI</p>
                <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
