"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, ClipboardCheck, Database, FileBarChart, GraduationCap, LayoutDashboard, Lightbulb, LogOut,
  MessageCircle, MoreHorizontal, Settings, ShieldAlert, UserRound, Users, X, type LucideIcon,
} from "lucide-react";
import { clearSession } from "@/lib/authApi";
import { useUIStore } from "@/store/useUIStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export type ShellRole = "dosen" | "mahasiswa" | "orangtua" | "kaprodi" | "admin";
// "tab" = nama pendek yang tampil di tab bar HP. Item tanpa "tab" masuk ke menu "Lainnya".
type NavItem = { href: string; label: string; icon: LucideIcon; tab?: string };

const CONFIG: Record<ShellRole, { label: string; home: string; nav: NavItem[] }> = {
  dosen: {
    label: "Dosen PA", home: "/dashboard",
    nav: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tab: "Beranda" },
      { href: "/dashboard/mahasiswa", label: "Mahasiswa Bimbingan", icon: Users, tab: "Mahasiswa" },
      { href: "/dashboard/risiko", label: "Skor Risiko", icon: ShieldAlert },
      { href: "/dashboard/intervensi", label: "Tindak Lanjut", icon: ClipboardCheck },
      { href: "/dashboard/notifikasi", label: "Notifikasi WhatsApp", icon: Bell, tab: "Notifikasi" },
      { href: "/dashboard/kontak", label: "Kontak Orang Tua", icon: MessageCircle },
    ],
  },
  mahasiswa: {
    label: "Mahasiswa", home: "/dashboard-mahasiswa",
    nav: [
      { href: "/dashboard-mahasiswa", label: "Dashboard", icon: LayoutDashboard, tab: "Beranda" },
      { href: "/dashboard-mahasiswa/profil", label: "Profil Saya", icon: UserRound, tab: "Profil" },
      { href: "/dashboard-mahasiswa/risiko", label: "Status Risiko", icon: ShieldAlert, tab: "Risiko" },
      { href: "/dashboard-mahasiswa/rekomendasi", label: "Rekomendasi", icon: Lightbulb },
      { href: "/dashboard-mahasiswa/notifikasi", label: "Notifikasi", icon: Bell, tab: "Notifikasi" },
      { href: "/dashboard-mahasiswa/pengaturan", label: "Pengaturan Akun", icon: Settings },
    ],
  },
  orangtua: {
    label: "Orang tua", home: "/dashboard-orangtua",
    nav: [
      { href: "/dashboard-orangtua", label: "Dashboard Anak", icon: LayoutDashboard, tab: "Beranda" },
      { href: "/dashboard-orangtua/risiko", label: "Status Risiko", icon: ShieldAlert, tab: "Risiko" },
      { href: "/dashboard-orangtua/notifikasi", label: "Notifikasi", icon: Bell, tab: "Notifikasi" },
      { href: "/dashboard-orangtua/kontak", label: "Kontak Dosen PA", icon: MessageCircle },
      { href: "/dashboard-orangtua/profil", label: "Profil", icon: UserRound, tab: "Profil" },
      { href: "/dashboard-orangtua/pengaturan", label: "Pengaturan Akun", icon: Settings },
    ],
  },
  kaprodi: {
    label: "Kaprodi", home: "/dashboard-kaprodi",
    nav: [
      { href: "/dashboard-kaprodi", label: "Dashboard Prodi", icon: LayoutDashboard, tab: "Beranda" },
      { href: "/dashboard-kaprodi/laporan", label: "Laporan Prodi", icon: FileBarChart, tab: "Laporan" },
      { href: "/dashboard-kaprodi/risiko", label: "Daftar Risiko", icon: ShieldAlert, tab: "Risiko" },
    ],
  },
  admin: {
    label: "Admin", home: "/dashboard-admin",
    nav: [
      { href: "/dashboard-admin", label: "Dashboard", icon: LayoutDashboard, tab: "Beranda" },
      { href: "/dashboard-admin/data", label: "Data Akademik", icon: Database, tab: "Data" },
      { href: "/dashboard-admin/pengguna", label: "Manajemen Pengguna", icon: Users, tab: "Pengguna" },
    ],
  },
};

function readInitials() {
  try {
    const m = document.cookie.match(/(?:^|; )sew_email=([^;]*)/);
    const email = m?.[1] ? decodeURIComponent(m[1]) : "";
    return (email.split("@")[0] ?? "").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  } catch { return ""; }
}

// Dashboard utama hanya aktif di path persis; sub-halaman aktif untuk dirinya sendiri.
const isActive = (pathname: string, href: string) => pathname === href;

/**
 * Cangkang aplikasi semua role. Desktop: rail ikon melayang di kiri (gaya "asimetris").
 * Mobile: tab bar melayang di bawah, supaya tampilannya langsung siap dijadikan aplikasi mobile.
 */
export default function AppShell({ role, children }: Readonly<{ role: ShellRole; children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const cfg = CONFIG[role];
  const [initials, setInitials] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setInitials(readInitials()), []);
  // Menu "Lainnya" tertutup otomatis saat pindah halaman atau menekan Esc.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const tabs = cfg.nav.filter((n) => n.tab);
  const more = cfg.nav.filter((n) => !n.tab);

  async function logout() {
    await clearSession();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      {/* ---------- Desktop: rail ikon ---------- */}
      <aside
        className="fixed bottom-5 left-5 top-5 z-30 hidden w-[74px] flex-col items-center gap-2 rounded-[28px] border py-5 md:flex"
        style={{ background: "var(--rail-bg)", borderColor: "var(--rail-border)" }}
      >
        <Link href={cfg.home} aria-label="Student Early Warning AI" className="mb-3 grid h-11 w-11 place-items-center" style={{ color: "var(--rail-on-bg)" }}>
          <GraduationCap size={28} />
        </Link>
        <nav aria-label={`Navigasi ${cfg.label}`} className="flex flex-col items-center gap-2">
          {cfg.nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} title={label} aria-label={label} aria-current={isActive(pathname, href) ? "page" : undefined} onClick={() => setActiveTab(href)} className="rail-item">
              <Icon size={20} />
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-2">
          <ThemeToggle className="!border-transparent !bg-transparent !text-[color:var(--rail-fg)] hover:!bg-white/10" />
          <button type="button" onClick={logout} title="Keluar" aria-label="Keluar" className="rail-item"><LogOut size={19} /></button>
          <span title={cfg.label} className="mt-1 grid h-11 w-11 place-items-center rounded-full text-xs font-extrabold" style={{ background: "var(--rail-on-bg)", color: "var(--rail-on-fg)" }}>{initials || cfg.label.slice(0, 2).toUpperCase()}</span>
        </div>
      </aside>

      {/* ---------- Mobile: bar atas ---------- */}
      <header className="flex items-center justify-between px-4 pb-1 pt-[max(1rem,env(safe-area-inset-top))] md:hidden">
        <Link href={cfg.home} className="flex items-center gap-2.5 font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold" style={{ background: "var(--rail-bg)", color: "var(--rail-on-bg)" }}>{initials || cfg.label.slice(0, 2).toUpperCase()}</span>
          <span className="leading-tight"><span className="block text-xs font-semibold text-slate-500">{cfg.label}</span><span className="block text-sm">Early Warning AI</span></span>
        </Link>
        <ThemeToggle />
      </header>

      {/* ---------- Konten ---------- */}
      <main className="min-w-0 px-4 pb-32 pt-4 md:pb-10 md:pl-[116px] md:pr-7 md:pt-7">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>

      {/* ---------- Mobile: tab bar melayang (ikon + nama) + menu "Lainnya" ---------- */}
      <nav
        aria-label={`Navigasi ${cfg.label}`}
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex h-[66px] items-stretch rounded-[26px] border px-1.5 shadow-2xl md:hidden"
        style={{ background: "var(--rail-bg)", borderColor: "var(--rail-border)" }}
      >
        {tabs.map(({ href, label, tab, icon: Icon }) => (
          <Link key={href} href={href} aria-label={label} aria-current={isActive(pathname, href) ? "page" : undefined} onClick={() => setActiveTab(href)} className="tab-item">
            <span className="pill"><Icon size={19} /></span>{tab}
          </Link>
        ))}
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Menu lainnya" aria-haspopup="dialog" className="tab-item" aria-current={more.some((m) => isActive(pathname, m.href)) ? "page" : undefined}>
          <span className="pill"><MoreHorizontal size={19} /></span>Lainnya
        </button>
      </nav>

      {menuOpen && (
        <>
          <div className="sheet-bg md:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Menu lainnya" className="sheet md:hidden">
            <div className="mb-3 flex items-center justify-between">
              <div><p className="text-xs font-semibold text-slate-500">{cfg.label}</p><h2 className="text-lg font-extrabold">Menu</h2></div>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white"><X size={18} /></button>
            </div>
            <ul className="space-y-2">
              {more.map(({ href, label, icon: Icon }) => (
                <li key={href}><Link href={href} className="row-card font-semibold" aria-current={isActive(pathname, href) ? "page" : undefined}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100"><Icon size={19} /></span>{label}</Link></li>
              ))}
              <li><div className="row-card font-semibold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100"><Settings size={19} /></span><span className="flex-1">Tampilan</span><ThemeToggle /></div></li>
              <li><button type="button" onClick={logout} className="row-card w-full font-semibold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-red-600"><LogOut size={19} /></span>Keluar</button></li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
