"use client";

import { ChangeEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileSpreadsheet, RefreshCw, UploadCloud, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStudentsQuery } from "@/hooks/useData";
import { createStudent, updateStudent } from "@/lib/api";
import { csvToRecords } from "@/lib/csv";
import { studentSchema } from "@/lib/schemas";
import { asStudentId, type Student } from "@/lib/types";

const REQUIRED_COLUMNS = ["nim", "nama", "ipk", "presensi", "lms", "tugas"] as const;
const DEFAULT_PRODI = "D3 Teknik Informatika";

type ParsedImport = { valid: Student[]; errors: string[] };

function toStudents(records: Array<Record<string, string>>): ParsedImport {
  const valid: Student[] = [];
  const errors: string[] = [];
  records.forEach((row, index) => {
    const result = studentSchema.safeParse({
      nim: row.nim,
      name: row.nama,
      prodi: row.prodi || DEFAULT_PRODI,
      angkatan: row.angkatan ? Number(row.angkatan) : new Date().getFullYear(),
      gpa: Number((row.ipk ?? "").replace(",", ".")),
      attendance: Number(row.presensi),
      lms: Number(row.lms),
      assignments: Number(row.tugas),
    });
    if (result.success) valid.push({ ...result.data, nim: asStudentId(result.data.nim) });
    else errors.push(`Baris ${index + 2}: ${result.error.issues[0]?.message ?? "data tidak valid"}`);
  });
  return { valid, errors };
}

export default function AdminData() {
  const qc = useQueryClient();
  const { data: students = [] } = useStudentsQuery();
  const [status, setStatus] = useState("Belum ada sinkronisasi pada sesi ini.");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const previewRows: Student[] = parsed ? parsed.valid.slice(0, 5) : students.slice(0, 5);
  const totalRows = parsed ? parsed.valid.length : students.length;

  function sync() {
    setError("");
    setStatus("Sinkronisasi SIAKAD (simulasi) sedang diproses...");
    window.setTimeout(() => {
      void qc.invalidateQueries({ queryKey: ["students"] });
      setStatus(`Sinkronisasi SIAKAD (simulasi) selesai pada ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}.`);
    }, 500);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setError("");
    setParsed(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Impor saat ini hanya menerima file CSV. Format Excel dapat ditambahkan saat backend tersedia.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("File tidak dapat dibaca.");
    reader.onload = () => {
      try {
        const result = toStudents(csvToRecords(String(reader.result), REQUIRED_COLUMNS));
        setParsed(result);
        setStatus(`File ${file.name} dibaca: ${result.valid.length} baris valid, ${result.errors.length} baris bermasalah.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "File tidak dapat dibaca.");
      }
    };
    reader.readAsText(file);
  }

  async function runImport() {
    if (!parsed || parsed.valid.length === 0) return;
    setImporting(true);
    setError("");
    const existing = new Set(students.map((student) => String(student.nim)));
    let created = 0;
    let updated = 0;
    const failures: string[] = [];
    for (const student of parsed.valid) {
      try {
        if (existing.has(String(student.nim))) {
          await updateStudent(student);
          updated++;
        } else {
          await createStudent(student);
          created++;
        }
      } catch (err) {
        failures.push(`${student.nim}: ${err instanceof Error ? err.message : "gagal disimpan"}`);
      }
    }
    await Promise.all(["students", "student-options", "risks"].map((key) => qc.invalidateQueries({ queryKey: [key] })));
    setImporting(false);
    setParsed(null);
    setStatus(`Impor selesai: ${created} ditambahkan, ${updated} diperbarui, ${failures.length} gagal.`);
    if (failures.length) setError(failures.slice(0, 5).join("; "));
  }

  const rowErrors = parsed?.errors ?? [];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">Administrator</p>
        <h1 className="text-2xl font-bold">Manajemen Data Akademik</h1>
        <p className="mt-1 text-sm text-slate-500">FR-02 dan FR-03: impor data akademik dan LMS dari file CSV.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <FileSpreadsheet className="text-blue-600" />
              <h2 className="mt-3 font-bold">SIAKAD</h2>
              <p className="mt-1 text-sm text-slate-500">Nilai, IPK/IPS, dan presensi mahasiswa.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Simulasi</span>
          </div>
          <Button className="mt-5" onClick={sync}><RefreshCw size={16} className="mr-2" />Sinkronkan Data</Button>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <FileSpreadsheet className="text-indigo-600" />
              <h2 className="mt-3 font-bold">Impor CSV</h2>
              <p className="mt-1 text-sm text-slate-500">Kolom wajib: {REQUIRED_COLUMNS.join(", ")}. Opsional: prodi, angkatan. Pemisah koma atau titik koma.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Aktif</span>
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-sm font-semibold hover:bg-slate-50">
            <UploadCloud size={17} className="mr-2" />Pilih file CSV
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFile} />
          </label>
          {fileName && <p className="mt-2 text-xs text-slate-500">File: {fileName}</p>}
        </Card>
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Status Pipeline</h2>
            <p className="text-sm text-slate-500" role="status">{status}</p>
          </div>
          {error ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"><XCircle size={16} />Ada masalah</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600"><CheckCircle2 size={16} />Siap</span>
          )}
        </div>
        {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {rowErrors.length > 0 && (
          <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">{rowErrors.length} baris dilewati:</p>
            <ul className="mt-1 list-disc pl-5">{rowErrors.slice(0, 5).map((message) => <li key={message}>{message}</li>)}</ul>
            {rowErrors.length > 5 && <p className="mt-1">…dan {rowErrors.length - 5} baris lainnya.</p>}
          </div>
        )}
        {parsed && parsed.valid.length > 0 && (
          <Button className="mt-4" onClick={runImport} disabled={importing}>
            {importing ? "Mengimpor..." : `Impor ${parsed.valid.length} baris valid`}
          </Button>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{parsed ? "Preview Impor" : "Data Saat Ini"}</h2>
            <p className="text-sm text-slate-500">Menampilkan maksimal 5 baris.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{totalRows} baris</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr><th className="p-3">NIM</th><th className="p-3">Nama</th><th className="p-3">IPK</th><th className="p-3">Presensi</th><th className="p-3">LMS</th><th className="p-3">Tugas</th></tr>
            </thead>
            <tbody>
              {previewRows.map((student) => (
                <tr key={student.nim} className="border-b">
                  <td className="p-3">{student.nim}</td>
                  <td className="p-3 font-semibold">{student.name}</td>
                  <td className="p-3">{student.gpa.toFixed(2)}</td>
                  <td className="p-3">{student.attendance}%</td>
                  <td className="p-3">{student.lms}%</td>
                  <td className="p-3">{student.assignments}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
