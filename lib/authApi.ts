// Koneksi frontend -> backend Flask (/api/v1) sesuai Dokumen Arsitektur Backend.
// Browser TIDAK memanggil Flask langsung: semuanya lewat route Next (same-origin, jadi tanpa masalah CORS):
//   /api/auth/*    -> login/logout (JWT disimpan di cookie httpOnly, tidak terlihat JavaScript browser)
//   /api/backend/* -> proxy ke Flask (menambahkan token dari cookie; endpoint daftar/verifikasi tanpa token)
import { apiBase } from "@/lib/apiBase";

export const API_URL = apiBase(process.env.NEXT_PUBLIC_API_URL);

export type ApiUser = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "mahasiswa" | "dosen" | "kaprodi" | "admin" | "orangtua";
  nim: string | null;
  no_wa?: string | null;
  email_verified?: boolean;
};

// Token tidak ikut dikirim ke browser; hanya identitas pengguna.
export type LoginResult = { role: ApiUser["role"]; user: ApiUser };
export type RegisterResult = ApiUser & { verification_required?: boolean; verification_sent?: boolean | null };

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(`Tidak bisa terhubung ke server (${url}). Pastikan backend Flask sudah jalan.`, 0);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message ?? "Terjadi kesalahan pada server.", res.status, json?.code);
  return json as T;
}

const post = <T,>(url: string, body: unknown) =>
  request<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// POST /auth/login - username boleh diisi email (lewat route Next: cookie httpOnly dipasang di sana)
export const loginApi = (username: string, password: string) =>
  post<LoginResult>("/api/auth/login", { username, password });

// POST /auth/login-ortu - orang tua masuk dengan NIM + email anak + password orang tua
export const loginOrtuApi = (nim: string, email: string, password: string) =>
  post<LoginResult>("/api/auth/login-ortu", { nim, email, password });

// POST /auth/register - daftar mandiri mahasiswa.
// Mode Google: kirim `credential` (ID token Google) + nim + password (email diambil server dari Google).
// Mode lama (Google nonaktif): kirim name + email + password + nim, lalu verifikasi lewat tautan email.
export const registerApi = (payload: {
  name?: string; email?: string; password: string; nim: string; credential?: string;
}) => post<RegisterResult>("/api/backend/auth/register", payload);

export type AuthConfig = {
  google_enabled: boolean;
  google_client_id: string | null;
  register_requires_google: boolean;
  allowed_email_domains: string[];
  roster_active: boolean;
};
// GET /auth/config - apakah login/daftar Google aktif (dan Client ID-nya)
export const authConfigApi = () => request<AuthConfig>("/api/backend/auth/config", { headers: { Accept: "application/json" } });

export type GooglePreview = {
  email: string; name: string; already_registered: boolean;
  nim: string | null; nama_resmi: string | null; domain_error: string | null;
};
// POST /auth/google/preview - langkah 1 daftar: verifikasi akun Google di server
export const googlePreviewApi = (credential: string) => post<GooglePreview>("/api/backend/auth/google/preview", { credential });

// POST /auth/google - masuk dengan Google (akun harus sudah terdaftar)
export const loginGoogleApi = (credential: string) => post<LoginResult>("/api/auth/google", { credential });

// POST /auth/register-ortu - daftar mandiri orang tua (diverifikasi NIM + email anak), lengkap dengan no WhatsApp
export const registerOrtuApi = (payload: {
  name: string; email: string; password: string; nim: string; email_mahasiswa: string; no_wa: string;
}) => post<RegisterResult>("/api/backend/auth/register-ortu", payload);

// POST /auth/verify-email - token dari tautan di email
export const verifyEmailApi = (token: string) =>
  post<{ message: string; email: string }>("/api/backend/auth/verify-email", { token });

// POST /auth/resend-verification - kirim ulang tautan (balasan selalu sama, tidak membocorkan email terdaftar)
// Orang tua: kirim `nim` anak + `email` anak (email orang tua tidak diketahui saat login).
export const resendVerificationApi = (email: string, nim?: string) =>
  post<{ message: string }>("/api/backend/auth/resend-verification", nim ? { email, nim } : { email });

// ---------- Sesi di browser ----------
// Token ada di cookie httpOnly (diatur server). Cookie di bawah ini TIDAK rahasia: hanya untuk
// middleware (role) dan tampilan (email/NIM). Data sensitif tetap dijaga JWT di server.

/** Simpan identitas (bukan token) setelah login. Dipakai LoginForm maupun LoginOrtuForm. */
export function saveSession(result: LoginResult, nim: string) {
  const { user } = result;
  document.cookie = `sew_role=${user.role}; path=/; max-age=604800; samesite=lax`;
  document.cookie = `sew_email=${encodeURIComponent(user.email)}; path=/; max-age=604800; samesite=lax`;
  // Cookie NIM wajib ditulis ulang setiap login supaya sesi akun sebelumnya tidak terbawa.
  document.cookie = nim ? `sew_nim=${nim}; path=/; max-age=604800; samesite=lax` : "sew_nim=; Max-Age=0; path=/";
}

/** Logout: server menghapus cookie httpOnly, lalu cookie identitas dihapus di sini. */
export async function clearSession() {
  try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
  for (const name of ["sew_role", "sew_email", "sew_nim"]) document.cookie = `${name}=; Max-Age=0; path=/`;
  try { localStorage.removeItem("sew_refresh_token"); } catch {} // sisa dari versi lama
}

/** GET data ber-token lewat proxy Next (token + refresh otomatis diurus server). */
function authedGet<T>(path: string): Promise<T> {
  return request<T>(`/api/backend${path}`, { headers: { Accept: "application/json" } }).catch((e) => {
    if (e instanceof ApiError && e.status === 401) throw new ApiError("Sesi berakhir. Silakan masuk lagi.", 401, e.code);
    throw e;
  });
}

export type KontakOrtu = { nim: string; nama_mahasiswa: string; orang_tua: string | null; no_wa_orang_tua: string | null };
export type KontakDosenPa = { nim: string; nama_mahasiswa: string | null; dosen_pa: string | null; no_wa_dosen_pa: string | null };

// GET /kontak/ortu - Dosen PA: no WhatsApp orang tua mahasiswa bimbingan
export const kontakOrtuApi = () => authedGet<KontakOrtu[]>("/kontak/ortu");
// GET /kontak/dosen-pa - Orang Tua: no WhatsApp Dosen PA anaknya
export const kontakDosenPaApi = () => authedGet<KontakDosenPa>("/kontak/dosen-pa");

/** Tautan WhatsApp (wa.me) dengan pesan pembuka. */
export function waLink(no: string | null | undefined, text?: string): string | null {
  return no ? `https://wa.me/${no}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null;
}

// GET /auth/me - data akun yang sedang masuk (nama, email, no WhatsApp, role)
export const meApi = () => authedGet<ApiUser>("/auth/me");
