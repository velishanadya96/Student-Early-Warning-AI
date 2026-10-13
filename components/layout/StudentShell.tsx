"use client";

import { LayoutDashboard, Lightbulb, ShieldAlert, UserRound } from "lucide-react";
import AppShell, { type ShellConfig } from "@/components/layout/AppShell";

const config: ShellConfig = {
  home: "/dashboard-mahasiswa",
  roleLabel: "Mahasiswa",
  description: "Melihat kondisi akademik dan rekomendasi pribadi",
  navLabel: "Navigasi mahasiswa",
  notificationHref: "/dashboard-mahasiswa/notifikasi",
  notificationLabel: "Notifikasi mahasiswa",
  nav: [
    { href: "/dashboard-mahasiswa", label: "Dashboard", icon: LayoutDashboard, key: "student-dashboard" },
    { href: "/dashboard-mahasiswa/profil", label: "Profil Saya", icon: UserRound, key: "profil" },
    { href: "/dashboard-mahasiswa/risiko", label: "Status Risiko", icon: ShieldAlert, key: "student-risiko" },
    { href: "/dashboard-mahasiswa/rekomendasi", label: "Rekomendasi", icon: Lightbulb, key: "rekomendasi" },
  ],
};

export default function StudentShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell config={config}>{children}</AppShell>;
}
