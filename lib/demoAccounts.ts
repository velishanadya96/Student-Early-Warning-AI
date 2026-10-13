import type { UserRole } from "@/lib/roles";

/** Akun demo dari backend/seed.py. Passwordnya = SEED_PASSWORD yang dipakai saat seed; lihat `demo` di app/login/page.tsx. */
export type DemoAccount = { name: string; email: string; role: UserRole; nim?: string };

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { name: "Alya Putri", email: "alya@student.uns.ac.id", role: "mahasiswa", nim: "2024001" },
  { name: "Bagas Pratama", email: "bagas@student.uns.ac.id", role: "mahasiswa", nim: "2024002" },
  { name: "Citra Lestari", email: "citra@student.uns.ac.id", role: "mahasiswa", nim: "2024003" },
  { name: "Dimas Ramadhan", email: "dimas@student.uns.ac.id", role: "mahasiswa", nim: "2024004" },
  { name: "Eka Sari", email: "eka@student.uns.ac.id", role: "mahasiswa", nim: "2024005" },
  { name: "Dosen PA", email: "dosen@student.uns.ac.id", role: "dosen" },
  { name: "Kaprodi Teknik Informatika", email: "kaprodi@student.uns.ac.id", role: "kaprodi" },
  { name: "Admin Student Early", email: "admin@student.uns.ac.id", role: "admin" },
  { name: "Orang Tua Mahasiswa (memantau Alya)", email: "orangtua@example.com", role: "orangtua" },
];
