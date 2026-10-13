"use client";

import { useInterventionsQuery, useStudentsQuery } from "@/hooks/useData";

export default function InterventionList() {
  const { data, isLoading, isError } = useInterventionsQuery();
  const { data: students = [] } = useStudentsQuery();
  const nameByNim = new Map(students.map((student) => [String(student.nim), student.name]));

  if (isLoading) return <div className="space-y-3">{[1,2].map((x) => <div key={x} className="skeleton h-20 rounded-xl" />)}</div>;
  if (isError) return <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Gagal memuat catatan.</div>;
  if (!data?.length) return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Belum ada catatan tindak lanjut.</div>;

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <article key={item.id} className="rounded-xl border p-4">
          <div className="flex justify-between gap-3">
            <p className="font-bold">{nameByNim.get(String(item.nim)) ?? "Mahasiswa"} <span className="font-normal text-slate-400">· {item.nim}</span></p>
            <time className="text-xs text-slate-400">{item.date}</time>
          </div>
          <p className="mt-2 text-sm text-slate-600">{item.note}</p>
        </article>
      ))}
    </div>
  );
}