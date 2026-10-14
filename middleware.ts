import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, FLASK, REFRESH_COOKIE, clearAuth, setAccess } from "@/lib/serverAuth";

const roleRoutes = [
  ["/dashboard-admin", "admin"],
  ["/dashboard-kaprodi", "kaprodi"],
  ["/dashboard-orangtua", "orangtua"],
  ["/dashboard-mahasiswa", "mahasiswa"],
  ["/dashboard", "dosen"],
] as const;

const destinations: Record<string, string> = {
  admin: "/dashboard-admin",
  dosen: "/dashboard",
  kaprodi: "/dashboard-kaprodi",
  mahasiswa: "/dashboard-mahasiswa",
  orangtua: "/dashboard-orangtua",
};

async function whoami(token: string): Promise<{ role: string } | null> {
  try {
    const r = await fetch(`${FLASK}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return r.ok ? await r.json() : null;
  } catch {
    return null; // backend mati = anggap belum login (halaman login akan menampilkan pesan koneksi)
  }
}

// Alihkan memakai host yang dipakai browser (header Host) supaya cookie tidak hilang karena pindah
// antara localhost dan 127.0.0.1.
function go(request: NextRequest, path: string) {
  const host = request.headers.get("host");
  const base = host ? `${request.nextUrl.protocol}//${host}` : request.url;
  return NextResponse.redirect(new URL(path, base));
}

// Sesi diverifikasi ke Flask (JWT), BUKAN dari cookie yang bisa diubah pengguna:
// role yang dipakai untuk memutuskan akses selalu berasal dari server.
export async function middleware(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  let me = access ? await whoami(access) : null;
  let fresh: string | undefined;
  if (!me && refresh) {
    try {
      const r = await fetch(`${FLASK}/auth/refresh`, { method: "POST", headers: { Authorization: `Bearer ${refresh}` }, cache: "no-store" });
      if (r.ok) {
        fresh = (await r.json()).access_token;
        me = await whoami(fresh!);
      }
    } catch {}
  }

  if (!me) {
    const res = isApi
      ? NextResponse.json({ code: "TOKEN_TIDAK_ADA", message: "Silakan login terlebih dahulu." }, { status: 401 })
      : go(request, "/login");
    if (access || refresh) clearAuth(res); // cookie sudah tidak valid
    return res;
  }

  let res = NextResponse.next();
  if (!isApi) {
    const match = roleRoutes.find(([prefix]) => path.startsWith(prefix));
    if (match && me.role !== match[1]) res = go(request, destinations[me.role] ?? "/login");
  }
  if (fresh) setAccess(res, fresh);
  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/dashboard-admin/:path*", "/dashboard-kaprodi/:path*", "/dashboard-orangtua/:path*", "/dashboard-mahasiswa/:path*",
    // API data mock bawaan Next: dulu terbuka untuk siapa saja, sekarang wajib login.
    "/api/students/:path*", "/api/risks/:path*", "/api/interventions/:path*", "/api/student/:path*",
  ],
};
