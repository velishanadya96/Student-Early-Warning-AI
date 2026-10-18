"use client";

import { Card } from "@/components/ui/Card";
import { useMahasiswaDashboard } from "@/hooks/useData";
import { Empty, ErrorBox, Loading } from "@/components/risk/RiskParts";

const SARAN: Record<string, string> = {
  attendance_rate: "Prioritaskan kehadiran di perkuliahan berikutnya; jika ada kendala (kesehatan, transportasi, pekerjaan), sampaikan ke Dosen PA agar dicarikan solusi.",
  GPA: "IPK-mu di bawah batas aman. Buat rencana perbaikan nilai: ikuti kelas tambahan, belajar kelompok, atau konsultasi mata kuliah yang sulit.",
  avg_course_grade: "Rata-rata nilai mata kuliah rendah. Cari tahu mata kuliah mana yang paling menarik nilai turun, lalu minta bimbingan dosen pengampu.",
  assignment_submission_rate: "Banyak tugas belum dikumpulkan. Catat semua tenggat dan kerjakan tugas yang tertunda mulai dari yang paling dekat tenggatnya.",
};

export default function StudentRecommendations() {
  const q = useMahasiswaDashboard();
  if (q.isLoading) return <Loading rows={2} h="h-24" />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return null;
  const { terbaru: t, pesan_dosen: pesan } = q.data;
  const items = [
    ...(t?.faktor.map((f) => ({ judul: f.singkat, isi: SARAN[f.kode] ?? "" })) ?? []),
    ...(t?.kategori === "High" ? [{ judul: "Temui Dosen PA", isi: "Hubungi Dosen PA untuk konseling akademik secepatnya." }] : []),
    ...pesan.map((p) => ({ judul: `Pesan Dosen PA (${p.tanggal})`, isi: p.isi })),
  ];

  return (
    <section>
      <div className="mb-6"><h1 className="text-2xl font-bold">Rekomendasi</h1><p className="mt-1 text-sm text-slate-500">Saran sesuai penyebab risikomu, ditambah pesan dari Dosen PA.</p></div>
      {!t && <Empty>Rekomendasi muncul setelah data akademikmu diimpor dan risikonya dihitung.</Empty>}
      {t && items.length === 0 && <Card className="max-w-2xl"><p className="font-semibold text-slate-700">Tidak ada yang perlu diperbaiki saat ini.</p><p className="mt-2 text-sm text-slate-500">Pertahankan kehadiran, nilai, dan ketepatan mengumpulkan tugas.</p></Card>}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it, i) => (
          <Card key={i}><div className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{i + 1}</span>
            <div><p className="font-semibold">{it.judul}</p><p className="mt-1 text-sm leading-6 text-slate-600">{it.isi}</p></div></div></Card>
        ))}
      </div>
    </section>
  );
}
