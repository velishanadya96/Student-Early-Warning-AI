import { isRole } from "@/lib/roles";
import { ACCESS_COOKIE, verifyAccessToken, type Claims } from "@/lib/server/auth";
import { callBackend } from "@/lib/server/backend";

/**
 * Sesi yang divalidasi ke backend untuk route handler data. Tanda tangan JWT saja tidak cukup: token yang
 * sudah di-logout atau akunnya dinonaktifkan harus ditolak. Hasil di-cache singkat supaya tidak membebani backend;
 * artinya pencabutan berlaku paling lambat TTL detik kemudian.
 */
const TTL_MS = 5_000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { claims: Claims; expires: number }>();

export async function claimsFromRequest(request: { cookies: { get(name: string): { value: string } | undefined } }): Promise<Claims | null> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token || !(await verifyAccessToken(token))) return null;

  const hit = cache.get(token);
  if (hit && hit.expires > Date.now()) return hit.claims;
  cache.delete(token);

  const result = await callBackend("/auth/me", { token });
  if (result.status !== 200) return null; // ditolak backend, atau backend mati (gagal tertutup)

  const user = result.body as { id?: unknown; role?: unknown; nim?: unknown };
  if (!isRole(user.role)) return null;
  const claims: Claims = { id: String(user.id), role: user.role, nim: typeof user.nim === "string" ? user.nim : null };

  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(token, { claims, expires: Date.now() + TTL_MS });
  return claims;
}
