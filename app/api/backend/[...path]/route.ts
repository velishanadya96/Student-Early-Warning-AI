// Proxy same-origin ke Flask: browser memanggil /api/backend/kontak/ortu, Next menambahkan
// "Authorization: Bearer <token dari cookie httpOnly>" dan memperbarui token (refresh) bila sudah kedaluwarsa.
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, FLASK, REFRESH_COOKIE, clearAuth, setAccess } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// Endpoint yang boleh dipanggil tanpa login (tidak butuh token). Lewat proxy ini browser tidak pernah
// memanggil Flask langsung, jadi tidak ada masalah CORS.
const PUBLIC = new Set(["auth/register", "auth/register-ortu", "auth/verify-email", "auth/resend-verification"]);

async function call(url: string, method: string, body: string | undefined, token: string | null) {
  return fetch(url, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body,
    cache: "no-store",
  });
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = `${FLASK}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.text();
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (PUBLIC.has(path.join("/")) && req.method === "POST") {
    try {
      const up = await call(url, "POST", body, null);
      return new NextResponse(await up.text(), { status: up.status, headers: { "Content-Type": up.headers.get("Content-Type") ?? "application/json" } });
    } catch {
      return NextResponse.json({ code: "BACKEND_MATI", message: "Tidak bisa terhubung ke server backend. Pastikan Flask sudah jalan." }, { status: 502 });
    }
  }
  if (!access && !refresh) return NextResponse.json({ code: "TOKEN_TIDAK_ADA", message: "Silakan login terlebih dahulu." }, { status: 401 });

  try {
    let fresh: string | undefined;
    let up = await call(url, req.method, body, access ?? null);
    if (up.status === 401 && refresh) {
      const r = await fetch(`${FLASK}/auth/refresh`, { method: "POST", headers: { Authorization: `Bearer ${refresh}` }, cache: "no-store" });
      if (r.ok) {
        fresh = (await r.json()).access_token;
        up = await call(url, req.method, body, fresh!);
      }
    }
    const res = new NextResponse(await up.text(), { status: up.status, headers: { "Content-Type": up.headers.get("Content-Type") ?? "application/json" } });
    if (fresh) setAccess(res, fresh);
    else if (up.status === 401) clearAuth(res); // refresh juga gagal: sesi benar-benar berakhir
    return res;
  } catch {
    return NextResponse.json({ code: "BACKEND_MATI", message: "Tidak bisa terhubung ke server backend." }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
