"use client";

import { useMemo } from "react";
import { useSessionQuery } from "@/hooks/useSession";
import { useStudentsQuery } from "@/hooks/useData";
import { buildCurrentStudent } from "@/lib/currentStudent";

/** Mahasiswa yang sedang login, dengan data akademik terbaru dari API. */
export function useCurrentStudent() {
  const session = useSessionQuery();
  const students = useStudentsQuery();

  const user = session.data?.role === "mahasiswa" ? session.data : null;

  const student = useMemo(
    () => (user ? buildCurrentStudent({ name: user.name, email: user.email, nim: user.nim ?? undefined }, students.data ?? []) : null),
    [user, students.data],
  );

  const isLoading = session.isLoading || (user !== null && students.isLoading);
  const isError = session.isError || (!session.isLoading && user === null) || students.isError;

  return { student: isError ? null : student, isLoading, isError };
}

/** Mahasiswa yang dipantau akun Orang Tua (ditentukan Admin di backend). Tidak ada fallback ke mahasiswa lain. */
export function useLinkedStudent() {
  const session = useSessionQuery();
  const students = useStudentsQuery();

  const nim = session.data?.role === "orangtua" ? session.data.nim : null;
  const student = useMemo(() => (nim ? (students.data ?? []).find((item) => String(item.nim) === nim) ?? null : null), [nim, students.data]);

  return { student, isLoading: session.isLoading || students.isLoading, isError: session.isError || students.isError };
}
