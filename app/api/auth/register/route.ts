import { NextResponse, type NextRequest } from "next/server";
import { callBackend, clientIpOf, jsonFromBackend } from "@/lib/server/backend";

/** Pendaftaran mandiri mahasiswa. Hanya field yang diizinkan yang diteruskan (role tidak bisa dipilih). */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) return NextResponse.json({ message: "Data pendaftaran tidak valid." }, { status: 400 });
  const { name, email, password, nim } = body as Record<string, unknown>;
  return jsonFromBackend(await callBackend("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, nim }), clientIp: clientIpOf(request) }));
}
