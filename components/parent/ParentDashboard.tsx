"use client";

import { AlertTriangle, BookOpen, CheckCircle2, ClipboardCheck, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLinkedStudent } from "@/hooks/useCurrentStudent";
import { badgeVariantFor, calculateRisk, cardToneFor } from "@/lib/risk";

export default function ParentDashboard() {
  const { student, isLoading, isError } = useLinkedStudent();

  if (isLoading) return <p className="text-sm text-slate-500" role="status">Memuat data mahasiswa...</p>;
  if (isError || !student) {
    return <p className="text-sm text-red-600" role="alert">Data mahasiswa tidak ditemukan. Silakan login kembali dan pilih mahasiswa.</p>;
  }

  const risk = calculateRisk(student);
  const indicators: Array<[string, number]> = [
    ["Presensi", student.attendance],
    ["Aktivitas LMS", student.lms],
    ["Pengumpulan Tugas", student.assignments],
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">Orang Tua</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Perkembangan Akademik {student.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan kondisi akademik berdasarkan data yang tersedia pada sistem.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card tone={cardToneFor(risk.category)}>
          <AlertTriangle className={risk.category === "Tinggi" ? "text-red-600" : "text-blue-600"} />
          <p className="mt-3 text-sm text-slate-500">Status Risiko</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-bold">{risk.category}</p>
            <Badge variant={badgeVariantFor(risk.category)}>{risk.score}</Badge>
          </div>
        </Card>
        <Card><GraduationCap className="text-blue-600" /><p className="mt-3 text-sm text-slate-500">IPK</p><p className="text-2xl font-bold">{student.gpa.toFixed(2)}</p></Card>
        <Card><CheckCircle2 className="text-emerald-600" /><p className="mt-3 text-sm text-slate-500">Presensi</p><p className="text-2xl font-bold">{student.attendance}%</p></Card>
        <Card><ClipboardCheck className="text-blue-600" /><p className="mt-3 text-sm text-slate-500">Tugas</p><p className="text-2xl font-bold">{student.assignments}%</p></Card>
      </div>

      <Card>
        <h2 className="text-lg font-bold">Indikator Akademik</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {indicators.map(([label, value]) => (
            <div key={label}>
              <div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{value}%</strong></div>
              <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold"><BookOpen size={18} className="text-blue-600" />Faktor dominan</div>
          <p className="mt-1 text-sm text-slate-600">{risk.dominantFactor}. Pantau perubahan indikator secara berkala.</p>
        </div>
      </Card>
    </section>
  );
}
