"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSession, logout } from "@/lib/authClient";

export const SESSION_KEY = ["session"] as const;

/** Akun yang sedang login (null = belum login). Cookie HttpOnly tidak terbaca dari JS, jadi lewat /api/auth/me. */
export function useSessionQuery() {
  return useQuery({ queryKey: SESSION_KEY, queryFn: fetchSession, staleTime: 5 * 60_000, retry: false, refetchOnWindowFocus: false });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => queryClient.clear(),
  });
}
