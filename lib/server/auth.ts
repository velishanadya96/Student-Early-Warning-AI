import { decodeJwt } from "jose/jwt/decode";
import { jwtVerify } from "jose/jwt/verify";
import { isRole, type UserRole } from "@/lib/roles";

/**
 * Verifikasi JWT buatan backend Flask. Modul ini dipakai middleware (Edge) dan route handler,
 * jadi hanya memakai API Web (tanpa modul Node).
 */
export const ACCESS_COOKIE = "sew_access";
export const REFRESH_COOKIE = "sew_refresh";

/** Secret bawaan backend untuk APP_ENV=development. Tidak pernah dipakai di production. */
const DEV_SECRET = "dev-only-jangan-dipakai-di-produksi-0123456789";

export type Claims = { id: string; role: UserRole; nim: string | null };

export function backendUrl(): string {
  return (process.env.BACKEND_URL ?? "http://127.0.0.1:5000").replace(/\/$/, "");
}

function secretBytes(): Uint8Array | null {
  const configured = process.env.JWT_SECRET_KEY;
  if (configured && configured.length >= 32) return new TextEncoder().encode(configured);
  if (process.env.NODE_ENV !== "production") return new TextEncoder().encode(DEV_SECRET);
  return null;
}

export function isSecretConfigured(): boolean {
  return secretBytes() !== null;
}

/** Kembalikan klaim kalau token access valid (tanda tangan, kedaluwarsa, tipe), selain itu null. */
export async function verifyAccessToken(token: string | undefined): Promise<Claims | null> {
  const secret = secretBytes();
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.type !== "access" || typeof payload.sub !== "string" || !isRole(payload.role)) return null;
    return { id: payload.sub, role: payload.role, nim: typeof payload.nim === "string" ? payload.nim : null };
  } catch {
    return null;
  }
}

/** Sisa umur token dalam detik (minimal 1), untuk Max-Age cookie. */
export function secondsUntilExpiry(token: string, fallback: number): number {
  try {
    const exp = decodeJwt(token).exp;
    return typeof exp === "number" ? Math.max(1, exp - Math.floor(Date.now() / 1000)) : fallback;
  } catch {
    return fallback;
  }
}

export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export type CookieOptions = { httpOnly: true; sameSite: "lax"; secure: boolean; path: "/"; maxAge: number };

export function cookieOptions(maxAge: number, secure: boolean): CookieOptions {
  return { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge };
}

export function isHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  return forwarded ? forwarded.split(",")[0]?.trim() === "https" : new URL(request.url).protocol === "https:";
}
