import type { UserRole } from "@/lib/roles";
import type { Claims } from "@/lib/server/auth";

/** Role yang boleh mengubah data (POST/PUT/PATCH/DELETE) per endpoint API. */
const WRITE_ROLES: Record<string, readonly UserRole[]> = {
  "/api/students": ["dosen", "admin"],
  "/api/interventions": ["dosen"],
  "/api/users": ["admin"],
};

const READ_ROLES: Record<string, readonly UserRole[]> = {
  "/api/users": ["admin"],
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function endpointOf(path: string): string {
  const match = Object.keys({ ...WRITE_ROLES, ...READ_ROLES }).find((base) => path === base || path.startsWith(`${base}/`));
  return match ?? path;
}

export function isRoleAllowed(path: string, method: string, role: UserRole): boolean {
  const endpoint = endpointOf(path);
  const allowed = SAFE_METHODS.has(method.toUpperCase()) ? READ_ROLES[endpoint] : WRITE_ROLES[endpoint];
  return !allowed || allowed.includes(role);
}

/** Mahasiswa dan Orang Tua hanya boleh melihat data NIM miliknya (atau anaknya). */
export function scopeToClaims<T extends { nim: string }>(items: readonly T[], claims: Claims): T[] {
  if (claims.role === "mahasiswa" || claims.role === "orangtua") {
    return items.filter((item) => claims.nim !== null && String(item.nim) === claims.nim);
  }
  return [...items];
}

/** Origin permintaan tulis harus sama dengan host aplikasi (pertahanan CSRF tambahan di luar SameSite). */
export function isSameOrigin(originHeader: string | null, host: string | null): boolean {
  if (!originHeader) return true;
  try {
    return new URL(originHeader).host === host;
  } catch {
    return false;
  }
}
