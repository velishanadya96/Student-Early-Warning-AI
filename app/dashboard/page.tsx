import type { Metadata } from "next";
import DashboardHome from "@/components/dashboard/DashboardHome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Student Early Warning AI",
  description: "Ringkasan risiko akademik mahasiswa dan pemantauan Dosen PA.",
};

export default function DashboardPage() {
  return <DashboardHome />;
}
