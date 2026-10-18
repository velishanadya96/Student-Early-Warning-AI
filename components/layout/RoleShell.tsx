"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, GraduationCap, LayoutDashboard, LogOut, Menu, Moon, Sun, Users, Database, FileBarChart, ShieldAlert, MessageCircle } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { clearSession } from "@/lib/authApi";

type Role = "admin" | "kaprodi" | "orangtua";

const config: Record<Role, { label: string; description: string; home: string; nav: { href: string; label: string; icon: typeof LayoutDashboard }[] }> = {
  admin: {
    label: "Administrator",
    description: "Kelola data, pengguna, dan integrasi akademik",
    home: "/dashboard-admin",
    nav: [
      { href: "/dashboard-admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard-admin/data", label: "Data Akademik", icon: Database },
      { href: "/dashboard-admin/pengguna", label: "Manajemen Pengguna", icon: Users },
    ],
  },
  kaprodi: {
    label: "Kaprodi",
    description: "Pantau kondisi risiko program studi secara agregat",
    home: "/dashboard-kaprodi",
    nav: [
      { href: "/dashboard-kaprodi", label: "Dashboard Agregat", icon: LayoutDashboard },
      { href: "/dashboard-kaprodi/laporan", label: "Laporan Prodi", icon: FileBarChart },
      { href: "/dashboard-kaprodi/risiko", label: "Daftar Risiko", icon: ShieldAlert },
    ],
  },
  orangtua: {
    label: "Orang Tua",
    description: "Memantau perkembangan akademik mahasiswa",
    home: "/dashboard-orangtua",
    nav: [
      { href: "/dashboard-orangtua", label: "Dashboard Anak", icon: LayoutDashboard },
      { href: "/dashboard-orangtua/risiko", label: "Status Risiko", icon: ShieldAlert },
      { href: "/dashboard-orangtua/notifikasi", label: "Notifikasi", icon: Bell },
      { href: "/dashboard-orangtua/kontak", label: "Kontak Dosen PA", icon: MessageCircle },
    ],
  },
};

export default function RoleShell({ role, children }: Readonly<{ role: Role; children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, setActiveTab, theme, toggleTheme } = useUIStore();
  const current = config[role];

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
          <Link href={current.home} className="flex items-center gap-2 font-bold">
            <span className="rounded-lg bg-blue-600 p-2 text-white"><GraduationCap size={18} /></span>
            <span className="hidden sm:inline">Student Early Warning AI</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:inline">{current.label}</span>
          <button aria-label="Ubah tema" onClick={toggleTheme} className="rounded-lg p-2 hover:bg-slate-100">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
          <Link href={role === "admin" ? "/dashboard-admin" : role === "kaprodi" ? "/dashboard-kaprodi/risiko" : "/dashboard-orangtua/notifikasi"} aria-label="Notifikasi" className="rounded-lg p-2 hover:bg-slate-100"><Bell size={18} /></Link>
          <button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100"><LogOut size={17} /><span className="hidden sm:inline">Keluar</span></button>
        </div>
      </header>

      <div className="flex">
        {sidebarOpen && (
          <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
            <nav aria-label={`Navigasi ${current.label}`} className="space-y-1">
              {current.nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return <Link key={item.href} href={item.href} onClick={() => setActiveTab(item.href)} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}><Icon size={18} /> {item.label}</Link>;
              })}
            </nav>
            <div className="mt-8 rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase text-blue-700">Role</p>
              <p className="mt-1 font-semibold text-slate-800">{current.label}</p>
              <p className="mt-1 text-xs text-slate-500">{current.description}</p>
            </div>
          </aside>
        )}
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
