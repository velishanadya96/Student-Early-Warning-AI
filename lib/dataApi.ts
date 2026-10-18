// Data akademik & risiko dari Flask lewat proxy Next (/api/backend/*): token ada di cookie httpOnly, tidak pernah di JavaScript.
import { ApiError } from "@/lib/authApi";
import type {
  AdminDashboard, Catatan, DosenDashboard, HitungHasil, ImportError, ImportHasil, KaprodiDashboard, MahasiswaDashboard,
  NotifSistem, NotifWa, OrtuDashboard, Riwayat, Skor,
} from "@/lib/types";

export class ImportFailed extends ApiError {
  errors: ImportError[];
  totalError: number;
  constructor(message: string, status: number, errors: ImportError[], totalError: number, code?: string) {
    super(message, status, code);
    this.errors = errors;
    this.totalError = totalError;
  }
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    return await fetch(`/api/backend${path}`, {
      method,
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Tidak bisa terhubung ke server. Coba lagi beberapa saat lagi.", 0);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await send(method, path, body);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (json?.code === "IMPOR_GAGAL" || json?.code === "KOLOM_KURANG") {
      const errors: ImportError[] = Array.isArray(json.errors) ? json.errors
        : [{ baris: 1, kolom: "header", pesan: `${json.message} Kolom terbaca: ${(json.kolom_terbaca ?? []).join(", ") || "-"}` }];
      throw new ImportFailed(json.message, res.status, errors, json.total_error ?? errors.length, json.code);
    }
    throw new ApiError(res.status === 401 ? "Sesi berakhir. Silakan masuk lagi." : (json?.message ?? "Terjadi kesalahan pada server."), res.status, json?.code);
  }
  return json as T;
}

const q = (periode?: string | null) => (periode ? `?periode=${encodeURIComponent(periode)}` : "");

export const dosenDashboardApi = (periode?: string | null) => call<DosenDashboard>("GET", `/dashboard/dosen${q(periode)}`);
export const kaprodiDashboardApi = (periode?: string | null) => call<KaprodiDashboard>("GET", `/dashboard/kaprodi${q(periode)}`);
export const adminDashboardApi = () => call<AdminDashboard>("GET", "/dashboard/admin");
export const mahasiswaDashboardApi = () => call<MahasiswaDashboard>("GET", "/dashboard/mahasiswa");
export const ortuDashboardApi = () => call<OrtuDashboard>("GET", "/dashboard/ortu");

export const riskDetailApi = (nim: string) =>
  call<{ mahasiswa: { nim: string; nama: string; prodi: string | null; angkatan: number | null; ipk: number | null }; terbaru: Skor | null; riwayat: Riwayat }>(
    "GET", `/risk/${encodeURIComponent(nim)}`);
export const periodeApi = () => call<{ periode: string[]; periode_sekarang: string }>("GET", "/risk/periode");
export const hitungRisikoApi = (periode?: string) => call<HitungHasil>("POST", "/risk/hitung", periode ? { periode } : {});

export const notifSistemApi = () => call<{ belum_dibaca: number; notifikasi: NotifSistem[] }>("GET", "/notifikasi");
export const tandaiBacaApi = (id: number) => call<NotifSistem>("PATCH", `/notifikasi/${id}/baca`);
export const waOrtuApi = () => call<{ provider: string; notifikasi: NotifWa[] }>("GET", "/notifikasi/wa-ortu");
export const tandaiTerkirimApi = (id: number) => call<NotifWa>("POST", `/notifikasi/${id}/terkirim`);
export const kirimUlangApi = (id: number) => call<NotifWa>("POST", `/notifikasi/${id}/kirim-ulang`);
export const prosesAntreanApi = () => call<{ terkirim: number }>("POST", "/notifikasi/proses");

export const catatanApi = (nim: string) => call<Catatan[]>("GET", `/catatan?nim=${encodeURIComponent(nim)}`);
export const tambahCatatanApi = (p: { nim: string; isi_catatan: string; isi_pesan?: string }) => call<Catatan>("POST", "/catatan", p);

export function importApi(jenis: "akademik" | "tugas", file: File, periode: string) {
  const f = new FormData();
  f.append("file", file);
  f.append("periode", periode);
  return call<ImportHasil>("POST", `/import/${jenis}`, f);
}

/** Unduh laporan (xlsx / pdf) dari backend lalu simpan sebagai file di browser. */
export async function unduhLaporan(format: "xlsx" | "pdf", periode?: string | null) {
  const res = await send("GET", `/laporan?format=${format}${periode ? `&periode=${encodeURIComponent(periode)}` : ""}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json?.message ?? "Laporan gagal dibuat.", res.status, json?.code);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-risiko-${periode ?? "terbaru"}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Periode akademik saat ini: Agustus-Januari = ganjil (TAHUN-1), Februari-Juli = genap (TAHUN-2). Sama dengan backend. */
export function periodeSekarang(d = new Date()): string {
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  return m >= 8 ? `${y}-1` : m === 1 ? `${y - 1}-1` : `${y}-2`;
}

export const pct = (v: number | null | undefined) => (v === null || v === undefined ? "-" : `${Math.round(v * 100)}%`);
/** Tanggal "2026-10-18" dari backend -> "18 Okt 2026" (format yang sama dengan notifikasi). */
export const tanggal = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "UTC" });
};
export const num = (v: number | null | undefined, d = 2) => (v === null || v === undefined ? "-" : v.toFixed(d));
