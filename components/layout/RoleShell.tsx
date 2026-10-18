"use client";

import AppShell from "@/components/layout/AppShell";

type Role = "admin" | "kaprodi" | "orangtua";

export default function RoleShell({ role, children }: Readonly<{ role: Role; children: React.ReactNode }>) {
  return <AppShell role={role}>{children}</AppShell>;
}
