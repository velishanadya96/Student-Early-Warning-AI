// Manajemen pengguna (FR-12) -> Flask /users, hanya untuk role admin. Lewat proxy Next (token di cookie httpOnly).
import { ApiError, type ApiUser } from "@/lib/authApi";

export type AdminUser = ApiUser & { is_active: boolean; id_dosen_pa: number | null };
export type NewUser = {
  role: ApiUser["role"]; name: string; email: string; password: string;
  nim?: string; nidn?: string; no_wa?: string;
};

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/backend${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Tidak bisa terhubung ke server.", 0);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message ?? "Terjadi kesalahan pada server.", res.status, json?.code);
  return json as T;
}

export const listUsersApi = () => call<AdminUser[]>("GET", "/users");
export const createUserApi = (u: NewUser) => call<AdminUser>("POST", "/users", u);
export const setActiveApi = (id: number, is_active: boolean) => call<AdminUser>("PUT", `/users/${id}`, { is_active });
export const assignDosenApi = (nim: string, id_dosen_pa: number) =>
  call<{ nim: string; id_dosen_pa: number }>("PATCH", `/users/mahasiswa/${encodeURIComponent(nim)}/dosen-pa`, { id_dosen_pa });
