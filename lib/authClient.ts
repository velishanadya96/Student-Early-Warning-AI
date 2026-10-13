import type { UserRole } from "@/lib/roles";

export type SessionUser = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  /** NIM mahasiswa sendiri, atau NIM anak yang dipantau (Orang Tua). */
  nim: string | null;
  is_active: boolean;
};

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new ApiRequestError("Tidak dapat terhubung ke server.", 0);
  }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = (typeof json === "object" && json !== null ? json : {}) as { message?: unknown; code?: unknown };
    throw new ApiRequestError(typeof body.message === "string" ? body.message : "Terjadi kesalahan pada server.", response.status, typeof body.code === "string" ? body.code : undefined);
  }
  return json as T;
}

export async function login(input: { email: string; password: string; role: UserRole }): Promise<SessionUser> {
  const result = await request<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: JSON.stringify(input) });
  return result.user;
}

export async function registerStudent(input: { name: string; email: string; password: string; nim: string }): Promise<SessionUser & { verification_required?: boolean }> {
  return request<SessionUser & { verification_required?: boolean }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export type MessageResponse = { ok: boolean; message?: string };

export async function verifyEmail(token: string): Promise<void> {
  await request("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
}

export async function resendVerification(email: string): Promise<string> {
  const result = await request<MessageResponse>("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
  return result.message ?? "Jika email terdaftar, tautan verifikasi sudah dikirim.";
}

export async function forgotPassword(email: string): Promise<string> {
  const result = await request<MessageResponse>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  return result.message ?? "Jika email terdaftar, tautan reset password sudah dikirim.";
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await request("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
}

export async function logout(): Promise<void> {
  await request("/api/auth/logout", { method: "POST" }).catch(() => undefined);
}

/** Sesi saat ini, atau null kalau belum login / sesi berakhir. */
export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const result = await request<{ user: SessionUser }>("/api/auth/me");
    return result.user;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) return null;
    throw error;
  }
}

export type NewUserInput = { name: string; email: string; password: string; role: UserRole; nim?: string; nidn?: string };

export async function fetchUsers(): Promise<SessionUser[]> {
  return request<SessionUser[]>("/api/users");
}

export async function createUser(input: NewUserInput): Promise<SessionUser> {
  return request<SessionUser>("/api/users", { method: "POST", body: JSON.stringify(input) });
}

export async function setUserActive(id: number, isActive: boolean): Promise<SessionUser> {
  return request<SessionUser>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify({ is_active: isActive }) });
}
