import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminDashboardApi, catatanApi, dosenDashboardApi, hitungRisikoApi, kaprodiDashboardApi, kirimUlangApi, mahasiswaDashboardApi,
  notifSistemApi, ortuDashboardApi, prosesAntreanApi, tambahCatatanApi, tandaiBacaApi, tandaiTerkirimApi, waOrtuApi,
} from "@/lib/dataApi";

const stale = { staleTime: 15_000, gcTime: 5 * 60_000, retry: false } as const;

export const useDosenDashboard = (periode?: string | null) => useQuery({ queryKey: ["dosen-dashboard", periode ?? null], queryFn: () => dosenDashboardApi(periode), ...stale });
export const useKaprodiDashboard = (periode?: string | null) => useQuery({ queryKey: ["kaprodi-dashboard", periode ?? null], queryFn: () => kaprodiDashboardApi(periode), ...stale });
export const useAdminDashboard = () => useQuery({ queryKey: ["admin-dashboard"], queryFn: adminDashboardApi, ...stale });
export const useMahasiswaDashboard = () => useQuery({ queryKey: ["mahasiswa-dashboard"], queryFn: mahasiswaDashboardApi, ...stale });
export const useOrtuDashboard = () => useQuery({ queryKey: ["ortu-dashboard"], queryFn: ortuDashboardApi, ...stale });
export const useNotifSistem = () => useQuery({ queryKey: ["notif-sistem"], queryFn: notifSistemApi, ...stale });
export const useWaOrtu = () => useQuery({ queryKey: ["wa-ortu"], queryFn: waOrtuApi, ...stale });
export const useCatatan = (nim: string) => useQuery({ queryKey: ["catatan", nim], queryFn: () => catatanApi(nim), enabled: Boolean(nim), ...stale });

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useTandaiBaca() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: number) => tandaiBacaApi(id), onSuccess: inv });
}
export function useTandaiTerkirim() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: number) => tandaiTerkirimApi(id), onSuccess: inv });
}
export function useKirimUlang() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: number) => kirimUlangApi(id), onSuccess: inv });
}
export function useProsesAntrean() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: prosesAntreanApi, onSuccess: inv });
}
export function useTambahCatatan() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: tambahCatatanApi, onSuccess: inv });
}
export function useHitungRisiko() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (periode?: string) => hitungRisikoApi(periode), onSuccess: inv });
}
