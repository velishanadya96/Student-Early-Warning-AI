import type { Metadata } from "next";
import StudentList from "@/components/students/StudentList";

export const metadata: Metadata = {
  title: "Mahasiswa Bimbingan | Student Early Warning AI",
};

export default function MahasiswaPage() {
  return <StudentList />;
}