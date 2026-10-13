import type { Student } from "@/lib/types";
import { asStudentId } from "@/lib/types";

/**
 * Mock database di memori server. HANYA boleh di-import dari kode server
 * (route handler dan React Server Component). Client mengambil data lewat /api/*.
 *
 * State disimpan di globalThis supaya semua route handler memakai instance yang
 * sama walaupun Next.js (dev/HMR) memuat modul ini lebih dari sekali.
 */
export type InterventionRecord = { id: number; nim: string; note: string; date: string };

type MockStore = {
  students: Student[];
  interventions: InterventionRecord[];
  nextInterventionId: number;
};

const globalStore = globalThis as typeof globalThis & { __sewMockStore?: MockStore };

function createSeed(): MockStore {
  const student = (nim: string, rest: Omit<Student, "nim">): Student => ({ nim: asStudentId(nim), ...rest });
  return {
    students: [
      student("2024001", { name: "Alya Putri", prodi: "D3 Teknik Informatika", angkatan: 2024, attendance: 96, gpa: 3.72, lms: 91, assignments: 94 }),
      student("2024002", { name: "Bagas Pratama", prodi: "D3 Teknik Informatika", angkatan: 2024, attendance: 58, gpa: 2.3, lms: 50, assignments: 60 }),
      student("2024003", { name: "Citra Lestari", prodi: "D3 Teknik Informatika", angkatan: 2024, attendance: 22, gpa: 1.3, lms: 28, assignments: 25 }),
      student("2024004", { name: "Dimas Ramadhan", prodi: "D3 Teknik Informatika", angkatan: 2024, attendance: 74, gpa: 2.86, lms: 62, assignments: 68 }),
      student("2024005", { name: "Eka Sari", prodi: "D3 Teknik Informatika", angkatan: 2024, attendance: 63, gpa: 2.5, lms: 54, assignments: 52 }),
    ],
    interventions: [
      { id: 1, nim: "2024003", note: "Jadwalkan konseling akademik dan evaluasi presensi.", date: "2026-09-14" },
    ],
    nextInterventionId: 2,
  };
}

const store = (globalStore.__sewMockStore ??= createSeed());

export const studentsDb: Student[] = store.students;
export const interventionsDb: InterventionRecord[] = store.interventions;

export function nextInterventionId(): number {
  return store.nextInterventionId++;
}
