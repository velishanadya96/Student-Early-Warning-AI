import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/server/auth";
import { callBackend } from "@/lib/server/backend";

/** Cabut kedua token di backend (supaya tidak bisa dipakai lagi), lalu hapus cookie. */
export async function POST(request: NextRequest) {
  const tokens = [request.cookies.get(ACCESS_COOKIE)?.value, request.cookies.get(REFRESH_COOKIE)?.value].filter((token): token is string => Boolean(token));
  await Promise.all(tokens.map((token) => callBackend("/auth/logout", { method: "POST", token })));

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
