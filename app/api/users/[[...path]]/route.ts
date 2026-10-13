import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/server/auth";
import { callBackend, jsonFromBackend } from "@/lib/server/backend";

/**
 * Proxy manajemen akun ke backend Flask (/api/v1/users). Hanya Admin: middleware menolak role lain,
 * dan backend memeriksa ulang role serta status aktif dari database.
 */
async function forward(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });

  const suffix = path.map(encodeURIComponent).join("/");
  const hasBody = request.method !== "GET" && request.method !== "DELETE";
  const body = hasBody ? await request.text() : undefined;
  return jsonFromBackend(await callBackend(`/users${suffix ? `/${suffix}` : ""}`, { method: request.method, token, body: body || undefined }));
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
export const dynamic = "force-dynamic";
