import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_HOME } from "@/lib/roles";
import { isRoleAllowed, isSameOrigin } from "@/lib/server/access";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  backendUrl,
  cookieOptions,
  isHttps,
  secondsUntilExpiry,
  verifyAccessToken,
  type Claims,
} from "@/lib/server/auth";

const roleRoutes = [
  ["/dashboard-admin", "admin"],
  ["/dashboard-kaprodi", "kaprodi"],
  ["/dashboard-orangtua", "orangtua"],
  ["/dashboard-mahasiswa", "mahasiswa"],
  ["/dashboard", "dosen"],
] as const;

/** Endpoint yang boleh dipanggil tanpa login. */
const PUBLIC_API = new Set([
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${backendUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null && "access_token" in body ? String(body.access_token) : null;
  } catch {
    return null;
  }
}

type Session = { claims: Claims; newAccessToken?: string };

/** Sesi valid dari cookie access; kalau kedaluwarsa/hilang, coba perbarui lewat refresh token. */
async function readSession(request: NextRequest): Promise<Session | null> {
  const claims = await verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  if (claims) return { claims };

  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  const newAccessToken = await refreshAccessToken(refresh);
  const renewed = await verifyAccessToken(newAccessToken ?? undefined);
  return renewed && newAccessToken ? { claims: renewed, newAccessToken } : null;
}

/** Teruskan request dengan cookie access yang sudah diperbarui, dan simpan cookie baru di browser. */
function proceed(request: NextRequest, session: Session): NextResponse {
  if (!session.newAccessToken) return NextResponse.next();
  const headers = new Headers(request.headers);
  const others = request.cookies.getAll().filter((cookie) => cookie.name !== ACCESS_COOKIE);
  headers.set("cookie", [...others.map((cookie) => `${cookie.name}=${cookie.value}`), `${ACCESS_COOKIE}=${session.newAccessToken}`].join("; "));
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(ACCESS_COOKIE, session.newAccessToken, cookieOptions(secondsUntilExpiry(session.newAccessToken, 900), isHttps(request)));
  return response;
}

function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status });
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/")) {
    if (request.method !== "GET" && request.method !== "HEAD" && !isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
      return apiError("Permintaan lintas situs ditolak.", 403);
    }
    if (PUBLIC_API.has(path)) return NextResponse.next();

    const session = await readSession(request);
    if (!session) return apiError("Silakan login terlebih dahulu.", 401);
    if (!isRoleAllowed(path, request.method, session.claims.role)) return apiError("Role Anda tidak memiliki izin untuk aksi ini.", 403);
    return proceed(request, session);
  }

  const match = roleRoutes.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  if (!match) return NextResponse.next();

  const session = await readSession(request);
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  if (session.claims.role !== match[1]) return NextResponse.redirect(new URL(ROLE_HOME[session.claims.role], request.url));
  return proceed(request, session);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/dashboard-admin/:path*",
    "/dashboard-kaprodi/:path*",
    "/dashboard-orangtua/:path*",
    "/dashboard-mahasiswa/:path*",
  ],
};
