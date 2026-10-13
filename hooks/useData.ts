import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createIntervention, createStudent, deleteStudent, fetchInterventions, fetchRisks, fetchStudentOptions, fetchStudents, updateStudent } from "@/lib/api";
import type { StudentInput, InterventionInput } from "@/lib/schemas";
import { asStudentId, type Student } from "@/lib/types";

export function useStudentsQuery() { return useQuery({ queryKey: ["students"], queryFn: fetchStudents, staleTime: 60_000, gcTime: 5 * 60_000 }); }
export function useStudentOptionsQuery() { return useQuery({ queryKey: ["student-options"], queryFn: fetchStudentOptions, staleTime: 60_000, gcTime: 5 * 60_000 }); }
export function useRisksQuery() { return useQuery({ queryKey: ["risks"], queryFn: fetchRisks, staleTime: 30_000, gcTime: 5 * 60_000 }); }
export function useInterventionsQuery() { return useQuery({ queryKey: ["interventions"], queryFn: fetchInterventions, staleTime: 15_000, gcTime: 5 * 60_000 }); }

function toStudent(input: StudentInput): Student { return { ...input, nim: asStudentId(input.nim) }; }

/** Data mahasiswa berubah -> daftar mahasiswa, pilihan login, dan risk score harus diambil ulang. */
function invalidateStudentData(qc: QueryClient) {
  return Promise.all(["students", "student-options", "risks"].map((key) => qc.invalidateQueries({ queryKey: [key] })));
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: StudentInput) => createStudent(toStudent(payload)), onSuccess: () => invalidateStudentData(qc) });
}
export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: StudentInput) => updateStudent(toStudent(payload)), onSuccess: () => invalidateStudentData(qc) });
}
export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (nim: string) => deleteStudent(nim), onSuccess: () => invalidateStudentData(qc) });
}
export function useCreateIntervention() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: InterventionInput) => createIntervention(payload), onSuccess: () => qc.invalidateQueries({ queryKey: ["interventions"] }) });
}
