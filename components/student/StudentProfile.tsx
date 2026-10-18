"use client";

import { ProfileView } from "@/components/profile/ProfileViews";

// Profil mahasiswa: kartu identitas + pintasan pengaturan akun (lihat components/profile).
export default function StudentProfile() {
  return <ProfileView role="mahasiswa" />;
}
