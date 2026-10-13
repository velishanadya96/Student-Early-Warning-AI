"use client";

import { ClipboardCheck, LayoutDashboard, ShieldAlert, Users } from "lucide-react";
import AppShell, { type ShellConfig } from "@/components/layout/AppShell";

const config: ShellConfig = {
  home: "/dashboard",
  roleLabel: "Dosen PA",
  description: "Pemantauan mahasiswa bimbingan",
  navLabel: "Navigasi utama",
  notificationHref: "/dashboard/notifikasi",
  notificationLabel: "Notifikasi",
  nav: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { href: "/dashboard/mahasiswa", label: "Mahasiswa", icon: Users, key: "mahasiswa" },
    { href: "/dashboard/risiko", label: "Risk Score", icon: ShieldAlert, key: "risiko" },
    { href: "/dashboard/intervensi", label: "Tindak Lanjut", icon: ClipboardCheck, key: "intervensi" },
  ],
};

export default function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell config={config}>{children}</AppShell>;
}
