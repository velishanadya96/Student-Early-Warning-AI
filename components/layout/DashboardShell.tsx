"use client";

import AppShell from "@/components/layout/AppShell";

// Dosen PA. Seluruh tampilan ada di AppShell (satu cangkang untuk semua role).
export default function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell role="dosen">{children}</AppShell>;
}
