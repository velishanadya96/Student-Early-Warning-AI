// Khusus server (route handler). Token JWT disimpan di cookie httpOnly sehingga TIDAK bisa dibaca JavaScript
// di browser (mengurangi dampak XSS). Browser hanya bicara dengan Next (same-origin); Next yang bicara dengan Flask.
import { NextResponse } from "next/server";
import { apiBase } from "@/lib/apiBase";

export const FLASK = apiBase(process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL);
export const ACCESS_COOKIE = "sew_session"; // dipakai middleware.ts (hanya cek ada/tidaknya)
export const REFRESH_COOKIE = "sew_refresh";

const secure = process.env.NODE_ENV === "production";
const base = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };

export function setAccess(res: NextResponse, token: string) {
  // Token di dalamnya kedaluwarsa 15 menit; cookie dibiarkan hidup selama refresh token berlaku
  // supaya route proxy bisa memperbaruinya otomatis, bukan memaksa login ulang.
  res.cookies.set(ACCESS_COOKIE, token, { ...base, maxAge: 60 * 60 * 24 * 7 });
}
export function setRefresh(res: NextResponse, token: string) {
  res.cookies.set(REFRESH_COOKIE, token, { ...base, maxAge: 60 * 60 * 24 * 7 });
}
export function clearAuth(res: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) res.cookies.set(name, "", { ...base, maxAge: 0 });
}

/** Teruskan login ke Flask; kalau sukses, pasang cookie httpOnly dan buang token dari body respons. */
export async function proxyLogin(flaskPath: string, req: Request): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  let upstream: Response;
  try {
    upstream = await fetch(`${FLASK}${flaskPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ code: "BACKEND_MATI", message: "Tidak bisa terhubung ke server. Coba lagi beberapa saat lagi." }, { status: 502 });
  }
  const json = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json(json, { status: upstream.status });

  const res = NextResponse.json({ role: json.role, user: json.user });
  setAccess(res, json.access_token);
  setRefresh(res, json.refresh_token);
  return res;
}
