"use client";

import AppShell from "@/components/layout/AppShell";

export default function StudentShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell role="mahasiswa">{children}</AppShell>;
}
