import { useQuery } from "@tanstack/react-query";
import { authConfigApi } from "@/lib/authApi";

/** Konfigurasi login/daftar dari backend (Google aktif atau tidak). */
export function useAuthConfig() {
  return useQuery({ queryKey: ["auth-config"], queryFn: authConfigApi, staleTime: 5 * 60_000, retry: 1 });
}
