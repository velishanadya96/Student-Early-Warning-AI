"use client";

import Link from "next/link";
import { ChevronRight, Lock, Settings } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useMahasiswaDashboard, useMe, useOrtuDashboard } from "@/hooks/useData";
import { ErrorBox, Loading } from "@/components/risk/RiskParts";
import { IdentityCard, KvList, LogoutButton, ThemeRow } from "@/components/profile/Parts";
import { num } from "@/lib/dataApi";
import type { MahasiswaDashboard } from "@/lib/types";

type Role = "mahasiswa" | "orangtua";
const BASE: Record<Role, string> = { mahasiswa: "/dashboard-mahasiswa", orangtua: "/dashboard-orangtua" };

function useStudentData(role: Role) {
  const mhs = useMahasiswaDashboard(role === "mahasiswa");
  const ortu = useOrtuDashboard(role === "orangtua");
  return role === "mahasiswa" ? mhs : ortu;
}

function identityRows(d: MahasiswaDashboard): [string, string][] {
  const m = d.mahasiswa;
  return [
    ["Nama lengkap", m.nama], ["NIM", m.nim], ["Program studi", m.prodi ?? "-"], ["Angkatan", m.angkatan ? String(m.angkatan) : "-"],
    ["IPK", (m.ipk ?? d.terbaru?.fitur.GPA) == null ? "-" : num((m.ipk ?? d.terbaru?.fitur.GPA) as number)], ["Dosen PA", d.dosen_pa?.nama ?? "Belum ditentukan"], ["Status", "Aktif"],
  ];
}

/** Profil: kartu identitas mahasiswa (untuk orang tua: identitas anak) + pintasan pengaturan. */
export function ProfileView({ role }: { role: Role }) {
  const q = useStudentData(role);
  const me = useMe();
  const d = q.data as MahasiswaDashboard | undefined;
  const ortu = role === "orangtua";

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{ortu ? "Profil" : "Profil Saya"}</h1>
        <p className="mt-1 text-sm text-slate-500">{ortu ? (me.data ? `${me.data.name} · ${me.data.email}` : "Akun orang tua") : (me.data?.email ?? "Data dari SIAKAD yang tersimpan di sistem.")}</p>
      </div>
      {q.isLoading && <Loading rows={2} h="h-32" />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {d && (
        <>
          {ortu && <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Anak yang terhubung</p>}
          <IdentityCard data={d} tag={ortu ? "Identitas mahasiswa" : "Kartu mahasiswa"} />
        </>
      )}
      <Card className="!p-4 sm:!p-5">
        <div className="divide-y divide-slate-200">
          <Link href={`${BASE[role]}/pengaturan`} className="flex items-center gap-3 py-3.5">
            <span className="text-slate-500"><Settings size={20} /></span>
            <span className="flex-1"><span className="block text-[15px] font-bold">Pengaturan akun</span><span className="block text-xs text-slate-500">{ortu ? "Data akun dan identitas anak" : "Identitas, akun, dan tampilan"}</span></span>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>
          <ThemeRow />
        </div>
      </Card>
      <LogoutButton />
    </section>
  );
}

/** Pengaturan akun: identitas mahasiswa (data kampus, hanya baca), data akun, dan tampilan. */
export function SettingsView({ role }: { role: Role }) {
  const q = useStudentData(role);
  const me = useMe();
  const d = q.data as MahasiswaDashboard | undefined;
  const ortu = role === "orangtua";
  const akun: [string, string][] = me.data
    ? ortu
      ? [["Nama", me.data.name], ["Email", me.data.email], ["Nomor WhatsApp", me.data.no_wa ? `+${me.data.no_wa}` : "Belum diisi"]]
      : [["Email", me.data.email], ["Peran", "Mahasiswa"]]
    : [];

  return (
    <section className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href={`${BASE[role]}/profil`} className="text-sm font-bold text-blue-600 hover:underline">← Profil</Link>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Pengaturan Akun</h1>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">{ortu ? "Identitas anak" : "Identitas mahasiswa"}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"><Lock size={12} />Data kampus</span>
        </div>
        <Card className="!p-4 sm:!p-5">
          {q.isLoading && <Loading rows={3} h="h-8" />}
          {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
          {d && <KvList rows={identityRows(d)} />}
        </Card>
        <p className="mt-2 px-1 text-xs leading-5 text-slate-500">Data ini berasal dari SIAKAD yang diimpor Admin. Jika ada yang keliru, hubungi Admin akademik.</p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-extrabold">{ortu ? "Akun orang tua" : "Akun"}</h2>
        <Card className="!p-4 sm:!p-5">
          {me.isLoading && <Loading rows={2} h="h-8" />}
          {me.isError && <ErrorBox error={me.error} onRetry={() => me.refetch()} />}
          {me.data && <KvList rows={akun} />}
        </Card>
        {ortu && <p className="mt-2 px-1 text-xs leading-5 text-slate-500">Peringatan akademik dikirim ke nomor WhatsApp ini.</p>}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-extrabold">Tampilan</h2>
        <Card className="!py-1 !px-4 sm:!px-5"><ThemeRow /></Card>
      </div>
      <LogoutButton />
    </section>
  );
}
