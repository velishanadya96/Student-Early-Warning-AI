"use client";

import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { clearSession } from "@/lib/authApi";
import { useUIStore } from "@/store/useUIStore";
import { num } from "@/lib/dataApi";
import type { MahasiswaDashboard } from "@/lib/types";

const inisial = (nama: string) => nama.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Kartu identitas mahasiswa. Dipakai di profil mahasiswa ("Kartu mahasiswa") dan profil orang tua ("Identitas anak"). */
export function IdentityCard({ data, tag }: { data: MahasiswaDashboard; tag: string }) {
  const { mahasiswa: m, dosen_pa } = data;
  const ipk = m.ipk ?? data.terbaru?.fitur.GPA ?? null;
  const fields: [string, string][] = [
    ["Program studi", m.prodi ?? "-"],
    ["Angkatan", m.angkatan ? String(m.angkatan) : "-"],
    ["IPK", ipk === null ? "-" : `${num(ipk)} / 4.00`],
    ["Dosen PA", dosen_pa?.nama ?? "Belum ditentukan"],
  ];
  return (
    <section className="idc" aria-label={tag}>
      <svg className="wm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5 19 19M5 19l3.5-3.5M15.5 8.5 19 5" /></svg>
      <div className="relative flex items-center justify-between gap-3">
        <span className="hero-muted text-[11px] font-bold uppercase tracking-[0.12em]">{tag}</span>
        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "color-mix(in srgb, var(--hero-fg) 14%, transparent)" }}>Aktif</span>
      </div>
      <div className="relative mt-5 flex items-center gap-4">
        <span aria-hidden="true" className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-[22px] text-2xl font-extrabold" style={{ background: "var(--hero-btn-bg)", color: "var(--hero-btn-fg)" }}>{inisial(m.nama)}</span>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold leading-tight tracking-tight">{m.nama}</p>
          <p className="hero-muted mt-1 text-sm font-bold tabular-nums">NIM {m.nim}</p>
        </div>
      </div>
      <dl className="relative mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t pt-4" style={{ borderColor: "color-mix(in srgb, var(--hero-fg) 20%, transparent)" }}>
        {fields.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </section>
  );
}

/** Baris pengaturan dengan saklar mode gelap (Obsidian). */
export function ThemeRow() {
  const { theme, toggleTheme } = useUIStore();
  const dark = theme === "dark";
  return (
    <button type="button" onClick={toggleTheme} role="switch" aria-checked={dark} className="flex w-full items-center gap-3 py-3.5 text-left">
      <span className="text-slate-500">{dark ? <Moon size={20} /> : <Sun size={20} />}</span>
      <span className="flex-1"><span className="block text-[15px] font-bold">Mode gelap</span><span className="block text-xs text-slate-500">Obsidian, nyaman untuk layar malam</span></span>
      <span aria-hidden="true" className="relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors" style={{ background: dark ? "var(--accent)" : "var(--color-slate-300)" }}>
        <span className="absolute top-[3px] h-6 w-6 rounded-full shadow transition-transform" style={{ left: 3, transform: dark ? "translateX(20px)" : "none", background: dark ? "var(--surface-solid)" : "#fff" }} />
      </span>
    </button>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => { await clearSession(); router.push("/login"); }}
      className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white font-bold transition hover:bg-slate-50"
    >
      <LogOut size={18} />Keluar
    </button>
  );
}

/** Pasangan label + nilai untuk daftar data kampus. */
export function KvList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-slate-200">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-3 text-sm">
          <dt className="shrink-0 text-slate-500">{k}</dt>
          <dd className="min-w-0 break-words text-right font-bold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
