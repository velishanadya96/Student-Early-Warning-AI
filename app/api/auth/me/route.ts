import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, verifyAccessToken } from "@/lib/server/auth";
import { callBackend } from "@/lib/server/backend";

/** Profil akun yang sedang login. Backend memeriksa akun masih aktif. */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token || !(await verifyAccessToken(token))) return NextResponse.json({ message: "Belum login." }, { status: 401 });

  const result = await callBackend("/auth/me", { token });
  if (result.status !== 200) {
    const response = NextResponse.json(result.body ?? { message: "Sesi tidak valid." }, { status: result.status === 502 ? 502 : 401 });
    if (result.status !== 502) {
      response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
      response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
    }
    return response;
  }
  return NextResponse.json({ user: result.body });
}

export const dynamic = "force-dynamic";
