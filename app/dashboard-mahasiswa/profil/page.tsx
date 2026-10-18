import type { Metadata } from "next";
import StudentProfile from "@/components/student/StudentProfile";

export const metadata: Metadata = { title: "Profil Saya | Student Early Warning AI" };

export default function StudentProfilePage() {
  return <StudentProfile />;
}
