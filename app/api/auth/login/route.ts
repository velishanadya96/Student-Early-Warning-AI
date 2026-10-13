import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ROLE_LABELS, isRole } from "@/lib/roles";
import { ACCESS_COOKIE, REFRESH_COOKIE, REFRESH_MAX_AGE, cookieOptions, isHttps, secondsUntilExpiry } from "@/lib/server/auth";
import { callBackend, clientIpOf, configError } from "@/lib/server/backend";

const bodySchema = z.object({
  email: z.string().min(1, "Email wajib diisi."),
  password: z.string().min(1, "Password wajib diisi."),
  role: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const missingConfig = configError();
  if (missingConfig) return missingConfig;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Data login tidak valid." }, { status: 400 });

  const result = await callBackend("/auth/login", { method: "POST", body: JSON.stringify({ username: parsed.data.email, password: parsed.data.password }), clientIp: clientIpOf(request) });
  if (result.status !== 200) return NextResponse.json(result.body ?? { message: "Login gagal." }, { status: result.status });

  const body = result.body as { access_token: string; refresh_token: string; role: string; user: { role: string } };

  // Pilihan "jenis akun" di form harus cocok dengan role akun, supaya salah pilih langsung ketahuan.
  const requested = parsed.data.role;
  if (requested && isRole(requested) && body.role !== requested) {
    const actual = isRole(body.role) ? ROLE_LABELS[body.role] : body.role;
    return NextResponse.json({ message: `Akun ini terdaftar sebagai ${actual}. Pilih jenis akun yang sesuai.` }, { status: 403 });
  }

  const secure = isHttps(request);
  const response = NextResponse.json({ user: body.user });
  response.cookies.set(ACCESS_COOKIE, body.access_token, cookieOptions(secondsUntilExpiry(body.access_token, 900), secure));
  response.cookies.set(REFRESH_COOKIE, body.refresh_token, cookieOptions(REFRESH_MAX_AGE, secure));
  return response;
}
