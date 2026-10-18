import type { Metadata } from "next";
import { SettingsView } from "@/components/profile/ProfileViews";

export const metadata: Metadata = { title: "Pengaturan Akun | Student Early Warning AI" };

export default function StudentSettingsPage() {
  return <SettingsView role="mahasiswa" />;
}
