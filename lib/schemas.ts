import { z } from "zod";

const angka = (label: string) => ({ invalid_type_error: `${label} harus berupa angka.`, required_error: `${label} wajib diisi.` });

export const studentSchema = z.object({
  nim: z.string().min(3, "NIM minimal 3 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  prodi: z.string().min(2, "Program studi minimal 2 karakter"),
  angkatan: z.number(angka("Angkatan")).int("Angkatan harus bilangan bulat.").min(2000, "Angkatan minimal 2000"),
  attendance: z.number(angka("Presensi")).min(0, "Presensi minimal 0").max(100, "Presensi maksimal 100"),
  gpa: z.number(angka("IPK")).min(0, "IPK minimal 0").max(4, "IPK maksimal 4"),
  lms: z.number(angka("Aktivitas LMS")).min(0, "Aktivitas LMS minimal 0").max(100, "Aktivitas LMS maksimal 100"),
  assignments: z.number(angka("Pengumpulan tugas")).min(0, "Pengumpulan tugas minimal 0").max(100, "Pengumpulan tugas maksimal 100"),
});

export const riskSchema = z.object({
  nim: z.string(),
  name: z.string(),
  score: z.number().min(0).max(100),
  category: z.enum(["Rendah", "Sedang", "Tinggi"]),
  dominantFactor: z.string(),
  updatedAt: z.string(),
});

export const interventionSchema = z.object({
  nim: z.string().min(3, "NIM wajib diisi"),
  note: z.string().min(10, "Catatan minimal 10 karakter"),
});

export const interventionRecordSchema = interventionSchema.extend({
  id: z.number().int(),
  date: z.string(),
});

export type StudentInput = z.infer<typeof studentSchema>;
export type InterventionInput = z.infer<typeof interventionSchema>;
