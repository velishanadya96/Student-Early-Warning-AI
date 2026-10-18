// Proxy same-origin ke Flask: browser memanggil /api/backend/kontak/ortu, Next menambahkan
// "Authorization: Bearer <token dari cookie httpOnly>" dan memperbarui token (refresh) bila sudah kedaluwarsa.
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, FLASK, REFRESH_COOKIE, clearAuth, setAccess } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// Endpoint yang boleh dipanggil tanpa login (tidak butuh token). Lewat proxy ini browser tidak pernah
// memanggil Flask langsung, jadi tidak ada masalah CORS.
const PUBLIC = new Set([
  "POST auth/register", "POST auth/register-ortu", "POST auth/verify-email", "POST auth/resend-verification",
  "POST auth/google/preview", "GET auth/config",
]);

// Body diteruskan apa adanya (byte), jadi JSON maupun unggahan file (multipart) sama-sama lolos;
// jawaban juga diteruskan sebagai byte supaya unduhan laporan (xlsx/pdf) tidak rusak.
async function call(url: string, method: string, body: ArrayBuffer | undefined, token: string | null, contentType: string | null) {
  return fetch(url, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && contentType ? { "Content-Type": contentType } : {}) },
    body,
    cache: "no-store",
  });
}

async function relay(up: Response) {
  const headers: Record<string, string> = { "Content-Type": up.headers.get("Content-Type") ?? "application/json" };
  const disp = up.headers.get("Content-Disposition");
  if (disp) headers["Content-Disposition"] = disp;
  return new NextResponse(await up.arrayBuffer(), { status: up.status, headers });
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = `${FLASK}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const raw = ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer();
  const body = raw && raw.byteLength ? raw : undefined;
  const contentType = req.headers.get("content-type");
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (PUBLIC.has(`${req.method} ${path.join("/")}`)) {
    try {
      return await relay(await call(url, req.method, body, null, contentType));
    } catch {
      return NextResponse.json({ code: "BACKEND_MATI", message: "Tidak bisa terhubung ke server. Coba lagi beberapa saat lagi." }, { status: 502 });
    }
  }
  if (!access && !refresh) return NextResponse.json({ code: "TOKEN_TIDAK_ADA", message: "Silakan masuk terlebih dahulu." }, { status: 401 });

  try {
    let fresh: string | undefined;
    let up = await call(url, req.method, body, access ?? null, contentType);
    if (up.status === 401 && refresh) {
      const r = await fetch(`${FLASK}/auth/refresh`, { method: "POST", headers: { Authorization: `Bearer ${refresh}` }, cache: "no-store" });
      if (r.ok) {
        fresh = (await r.json()).access_token;
        up = await call(url, req.method, body, fresh!, contentType);
      }
    }
    const res = await relay(up);
    if (fresh) setAccess(res, fresh);
    else if (up.status === 401) clearAuth(res); // refresh juga gagal: sesi benar-benar berakhir
    return res;
  } catch {
    return NextResponse.json({ code: "BACKEND_MATI", message: "Tidak bisa terhubung ke server backend." }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
