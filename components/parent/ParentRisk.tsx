"use client";

import { AlertTriangle, BookOpenCheck, CheckCircle2, GraduationCap, HeartHandshake } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLinkedStudent } from "@/hooks/useCurrentStudent";
import { badgeVariantFor, calculateRisk } from "@/lib/risk";

function Metric({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value: string }) {
  return (
    <Card>
      <Icon size={24} className="text-blue-600" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}

export default function ParentRisk() {
  const { student, isLoading, isError } = useLinkedStudent();

  if (isLoading) return <p className="text-sm text-slate-500" role="status">Memuat status risiko...</p>;
  if (isError || !student) {
    return <p className="text-sm text-red-600" role="alert">Data mahasiswa tidak ditemukan. Silakan login kembali dan pilih mahasiswa.</p>;
  }

  const risk = calculateRisk(student);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-600">Orang Tua</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Status Risiko Akademik</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan kondisi akademik mahasiswa yang terhubung dengan akun orang tua.</p>
      </div>

      <Card tone={risk.category === "Tinggi" ? "red" : "blue"} className="mb-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">Mahasiswa</p>
            <h2 className="text-2xl font-bold">{student.name}</h2>
            <p className="text-sm text-slate-500">{student.nim} · {student.prodi} · Angkatan {student.angkatan}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-slate-500">Status Risiko</p>
            <div className="mt-1 flex items-center gap-2 sm:justify-end">
              <span className="text-3xl font-bold">{risk.score}</span>
              <Badge variant={badgeVariantFor(risk.category)}>{risk.category}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={GraduationCap} label="IPK" value={student.gpa.toFixed(2)} />
        <Metric icon={CheckCircle2} label="Presensi" value={`${student.attendance}%`} />
        <Metric icon={BookOpenCheck} label="Aktivitas LMS" value={`${student.lms}%`} />
        <Metric icon={HeartHandshake} label="Tugas" value={`${student.assignments}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Faktor Risiko</h2>
          <p className="mb-4 text-sm text-slate-500">Faktor yang paling memengaruhi skor saat ini.</p>
          <div className="rounded-xl bg-amber-50 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">{risk.dominantFactor}</p>
                <p className="text-sm text-amber-800">Perlu dipantau bersama mahasiswa dan Dosen PA.</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Rekomendasi</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li>• Pantau kehadiran dan konsistensi mengikuti perkuliahan.</li>
            <li>• Dorong penyelesaian tugas sebelum tenggat.</li>
            <li>• Komunikasikan perkembangan dengan Dosen PA jika risiko meningkat.</li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
