"use client";

import { Database, FileBarChart, LayoutDashboard, ShieldAlert, Users } from "lucide-react";
import AppShell, { type ShellConfig } from "@/components/layout/AppShell";

type Role = "admin" | "kaprodi" | "orangtua";

const configs: Record<Role, ShellConfig> = {
  admin: {
    home: "/dashboard-admin",
    roleLabel: "Administrator",
    description: "Kelola data, pengguna, dan integrasi akademik",
    navLabel: "Navigasi Administrator",
    notificationHref: "/dashboard-admin",
    notificationLabel: "Notifikasi",
    nav: [
      { href: "/dashboard-admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard-admin/data", label: "Data Akademik", icon: Database },
      { href: "/dashboard-admin/pengguna", label: "Manajemen Pengguna", icon: Users },
    ],
  },
  kaprodi: {
    home: "/dashboard-kaprodi",
    roleLabel: "Kaprodi",
    description: "Pantau kondisi risiko program studi secara agregat",
    navLabel: "Navigasi Kaprodi",
    notificationHref: "/dashboard-kaprodi/risiko",
    notificationLabel: "Notifikasi",
    nav: [
      { href: "/dashboard-kaprodi", label: "Dashboard Agregat", icon: LayoutDashboard },
      { href: "/dashboard-kaprodi/laporan", label: "Laporan Prodi", icon: FileBarChart },
      { href: "/dashboard-kaprodi/risiko", label: "Daftar Risiko", icon: ShieldAlert },
    ],
  },
  orangtua: {
    home: "/dashboard-orangtua",
    roleLabel: "Orang Tua",
    description: "Memantau perkembangan akademik mahasiswa",
    navLabel: "Navigasi Orang Tua",
    notificationHref: "/dashboard-orangtua/risiko",
    notificationLabel: "Notifikasi",
    nav: [
      { href: "/dashboard-orangtua", label: "Dashboard Anak", icon: LayoutDashboard },
      { href: "/dashboard-orangtua/risiko", label: "Status Risiko", icon: ShieldAlert },
    ],
  },
};

export default function RoleShell({ role, children }: Readonly<{ role: Role; children: React.ReactNode }>) {
  return <AppShell config={configs[role]}>{children}</AppShell>;
}
