"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, GraduationCap, LayoutDashboard, LogOut, Menu,
  ShieldAlert, UserRound, Lightbulb, Moon, Sun
} from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { clearSession } from "@/lib/authApi";

const navItems = [
  { href: "/dashboard-mahasiswa", label: "Dashboard", icon: LayoutDashboard, key: "student-dashboard" },
  { href: "/dashboard-mahasiswa/profil", label: "Profil Saya", icon: UserRound, key: "profil" },
  { href: "/dashboard-mahasiswa/risiko", label: "Status Risiko", icon: ShieldAlert, key: "student-risiko" },
  { href: "/dashboard-mahasiswa/rekomendasi", label: "Rekomendasi", icon: Lightbulb, key: "rekomendasi" },
  { href: "/dashboard-mahasiswa/notifikasi", label: "Notifikasi", icon: Bell, key: "notifikasi" },
];

export default function StudentShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, setActiveTab, theme, toggleTheme } = useUIStore();

  async function logout() {
    await clearSession();
    router.push("/login");
  }

  return (
    <div className={theme === "dark" ? "min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-slate-50 text-slate-900"}>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button aria-label="Buka atau tutup sidebar" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <Link href="/dashboard-mahasiswa" className="flex items-center gap-2 font-bold">
            <span className="rounded-lg bg-blue-600 p-2 text-white"><GraduationCap size={18} /></span>
            <span className="hidden sm:inline">Student Early Warning AI</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Ubah tema" onClick={toggleTheme} className="rounded-lg p-2 hover:bg-slate-100">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link href="/dashboard-mahasiswa/notifikasi" aria-label="Notifikasi mahasiswa" className="rounded-lg p-2 hover:bg-slate-100"><Bell size={18} /></Link>
          <button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100">
            <LogOut size={17} /><span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {sidebarOpen && (
          <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
            <nav aria-label="Navigasi mahasiswa" className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setActiveTab(item.key)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                    <Icon size={18} /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase text-blue-700">Role</p>
              <p className="mt-1 font-semibold text-slate-800">Mahasiswa</p>
              <p className="mt-1 text-xs text-slate-500">Melihat kondisi akademik dan rekomendasi pribadi</p>
            </div>
          </aside>
        )}
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
