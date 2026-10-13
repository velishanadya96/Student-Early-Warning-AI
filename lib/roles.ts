export const ROLES = ["admin", "kaprodi", "dosen", "mahasiswa", "orangtua"] as const;
export type UserRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  kaprodi: "Kaprodi",
  dosen: "Dosen PA",
  mahasiswa: "Mahasiswa",
  orangtua: "Orang Tua",
};

export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/dashboard-admin",
  kaprodi: "/dashboard-kaprodi",
  dosen: "/dashboard",
  mahasiswa: "/dashboard-mahasiswa",
  orangtua: "/dashboard-orangtua",
};

export function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
