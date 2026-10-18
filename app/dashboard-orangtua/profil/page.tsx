import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileViews";

export const metadata: Metadata = { title: "Profil | Student Early Warning AI" };

export default function ParentProfilePage() {
  return <ProfileView role="orangtua" />;
}
