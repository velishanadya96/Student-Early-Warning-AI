"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, GraduationCap, LogOut, Menu, Moon, Sun, X, type LucideIcon } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useLogout, useSessionQuery } from "@/hooks/useSession";

export type ShellNavItem = { href: string; label: string; icon: LucideIcon; key?: string };

export type ShellConfig = {
  home: string;
  roleLabel: string;
  description: string;
  navLabel: string;
  notificationHref: string;
  notificationLabel: string;
  nav: ShellNavItem[];
};

const DESKTOP_QUERY = "(min-width: 768px)";

export default function AppShell({ config, children }: Readonly<{ config: ShellConfig; children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, setActiveTab, theme, toggleTheme } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useSessionQuery();
  const logoutMutation = useLogout();

  // Sesi berakhir atau akun dinonaktifkan: kembali ke login.
  useEffect(() => {
    if (!session.isLoading && session.data === null) router.replace("/login");
  }, [session.isLoading, session.data, router]);

  // Pulihkan tema yang tersimpan (sengaja setelah mount, lihat useUIStore).
  useEffect(() => {
    void useUIStore.persist.rehydrate();
  }, []);

  // Tutup drawer mobile setiap pindah halaman.
  useEffect(() => setMobileOpen(false), [pathname]);

  function logout() {
    logoutMutation.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  function toggleSidebar() {
    if (window.matchMedia(DESKTOP_QUERY).matches) setSidebarOpen(!sidebarOpen);
    else setMobileOpen((open) => !open);
  }

  const navigation = (
    <>
      <nav aria-label={config.navLabel} className="space-y-1">
        {config.nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setActiveTab(item.key ?? item.href)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Icon size={18} /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 rounded-2xl bg-blue-50 p-4">
        <p className="text-xs font-bold uppercase text-blue-700">Role</p>
        <p className="mt-1 font-semibold text-slate-800">{config.roleLabel}</p>
        {session.data && <p className="mt-1 truncate text-xs font-semibold text-slate-600" title={session.data.email}>{session.data.name}</p>}
        <p className="mt-1 text-xs text-slate-500">{config.description}</p>
      </div>
    </>
  );

  return (
    <div data-theme={theme} className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Buka atau tutup menu"
            aria-expanded={mobileOpen || sidebarOpen}
            onClick={toggleSidebar}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <Link href={config.home} className="flex items-center gap-2 font-bold">
            <span className="rounded-lg bg-blue-600 p-2 text-white"><GraduationCap size={18} /></span>
            <span className="hidden sm:inline">Student Early Warning AI</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:inline">{config.roleLabel}</span>
          <button type="button" aria-label="Ubah tema" onClick={toggleTheme} className="rounded-lg p-2 hover:bg-slate-100">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link href={config.notificationHref} aria-label={config.notificationLabel} className="rounded-lg p-2 hover:bg-slate-100"><Bell size={18} /></Link>
          <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100">
            <LogOut size={17} /><span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-30 md:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85%] overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-xl">
            <button type="button" aria-label="Tutup menu" onClick={() => setMobileOpen(false)} className="mb-3 ml-auto block rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button>
            {navigation}
          </aside>
        </div>
      )}

      <div className="flex">
        {sidebarOpen && (
          <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 md:block">
            {navigation}
          </aside>
        )}
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
