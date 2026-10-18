// Bentuk data dari backend Flask (/api/v1). Kategori risiko memakai istilah model: Low / Medium / High.
export type Kategori = "Low" | "Medium" | "High";

export type FiturKode = "GPA" | "avg_course_grade" | "attendance_rate" | "assignment_submission_rate";
export type Fitur = Record<FiturKode, number | null>;

/** Satu penyebab risiko, mis. { kode: "attendance_rate", label: "Kehadiran rendah: 54% (batas aman 75%)" } */
export type Faktor = { kode: FiturKode; nilai: number; dampak: number; label: string; singkat: string };

export type Skor = {
  id_score: number; nim: string; periode: string; skor: number; kategori: Kategori;
  faktor_dominan: string | null; fitur: Partial<Fitur>; faktor: Faktor[]; catatan_data: string[];
};

export type WaInfo = { id: number; status: "pending" | "terkirim" | "gagal"; link: string | null };

export type BarisMahasiswa = {
  nim: string; nama: string; prodi: string | null; angkatan: number | null; ipk: number | null; dosen_pa: string | null;
  periode: string | null; skor: number | null; kategori: Kategori | null; faktor_dominan: string | null;
  faktor: Faktor[]; fitur: Partial<Fitur>; id_score: number | null;
  orang_tua: { nama: string; no_wa: string | null } | null; wa: WaInfo | null;
};

export type Ringkasan = { High: number; Medium: number; Low: number; belum_dihitung: number; total: number };

export type DosenDashboard = {
  periode: string | null; ringkasan: Ringkasan; mahasiswa: BarisMahasiswa[]; wa_menunggu: number; periode_tersedia: string[];
};

export type KaprodiDashboard = {
  periode: string | null; ringkasan: Ringkasan; mahasiswa: BarisMahasiswa[]; mahasiswa_high: BarisMahasiswa[];
  per_angkatan: { angkatan: number | null; High: number; Medium: number; Low: number; belum_dihitung: number; total: number }[];
  penyebab_high: { kode: string; jumlah: number; nama: string }[];
  tren: { periode: string; High: number; Medium: number; Low: number }[];
  periode_tersedia: string[];
};

export type AdminDashboard = {
  mahasiswa: number; mahasiswa_punya_akun: number; mahasiswa_tanpa_dosen_pa: number; orang_tua: number; orang_tua_tanpa_wa: number;
  periode_tersedia: string[]; skor_tersimpan: number; wa: { pending: number; terkirim: number; gagal: number }; wa_provider: string;
};

export type Riwayat = { periode: string; skor: number; kategori: Kategori }[];
export type DosenKontak = { nama: string; no_wa: string | null } | null;

export type MahasiswaDashboard = {
  mahasiswa: { nim: string; nama: string; prodi: string | null; angkatan: number | null; ipk: number | null };
  terbaru: Skor | null; riwayat: Riwayat; pesan_dosen: { tanggal: string; isi: string }[];
  dosen_pa: DosenKontak; notifikasi_belum_dibaca: number;
};
export type OrtuDashboard = Omit<MahasiswaDashboard, "pesan_dosen">;

export type NotifSistem = { id: number; isi: string; kanal: string; status: string; dibaca: boolean; waktu: string | null; periode: string | null };
export type NotifWa = NotifSistem & {
  nim: string; nama_mahasiswa: string; orang_tua: string | null; no_tujuan: string | null; percobaan: number; link: string | null; kategori: Kategori;
};

export type Catatan = { id: number; nim: string; tanggal: string; isi_catatan: string | null; isi_pesan: string | null; dosen: string | null; periode: string | null };

export type ImportError = { baris: number; kolom: string; pesan: string };
export type ImportHasil = { periode: string; baris: number; mahasiswa: number; mahasiswa_baru?: number; terkumpul?: number };
export type HitungHasil = {
  periode: string; dihitung: number; Low: number; Medium: number; High: number; baru_high: string[];
  notifikasi_wa: number; high_tanpa_ortu: string[]; high_tanpa_dosen_pa: string[];
};

export const LABEL_KATEGORI: Record<Kategori, string> = { Low: "Rendah", Medium: "Sedang", High: "Tinggi" };
export const BADGE_KATEGORI: Record<Kategori, "low" | "medium" | "high"> = { Low: "low", Medium: "medium", High: "high" };
