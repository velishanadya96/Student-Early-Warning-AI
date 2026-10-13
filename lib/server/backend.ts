import { NextResponse } from "next/server";
import { backendUrl, isSecretConfigured } from "@/lib/server/auth";

export type BackendResult = { status: number; body: unknown };

/** Panggil API Flask. Gagal koneksi dikembalikan sebagai 502 berbahasa Indonesia. */
export async function callBackend(path: string, init: RequestInit & { token?: string; clientIp?: string } = {}): Promise<BackendResult> {
  const { token, clientIp, headers, ...rest } = init;
  try {
    const response = await fetch(`${backendUrl()}/api/v1${path}`, {
      ...rest,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(clientIp ? { "X-Forwarded-For": clientIp } : {}), ...headers },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (body === null && response.status >= 400) {
      // Bukan JSON dari Flask: biasanya BACKEND_URL salah atau port dipakai aplikasi lain (macOS: AirPlay Receiver memakai port 5000).
      return { status: 502, body: { code: "RESPONS_BACKEND_TIDAK_VALID", message: `Respons tak terduga dari backend (status ${response.status}). Periksa BACKEND_URL dan port backend.` } };
    }
    return { status: response.status, body };
  } catch {
    return { status: 502, body: { code: "BACKEND_TIDAK_TERSEDIA", message: "Server backend tidak dapat dihubungi. Pastikan backend Flask berjalan." } };
  }
}

/**
 * IP klien asli untuk rate limit backend. Diambil dari header reverse proxy; kalau tidak ada, kosong
 * (backend lalu melihat IP server Next). Aman hanya bila Next berada di belakang proxy tepercaya.
 */
export function clientIpOf(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || undefined;
}

export function jsonFromBackend(result: BackendResult): NextResponse {
  return NextResponse.json(result.body ?? {}, { status: result.status });
}

export function configError(): NextResponse | null {
  return isSecretConfigured()
    ? null
    : NextResponse.json({ message: "JWT_SECRET_KEY belum diisi di server frontend. Salin .env.example ke .env.local." }, { status: 500 });
}

/** Teruskan body JSON ke backend hanya dengan field yang diizinkan (tidak ada field liar yang ikut). */
export async function proxyPublicPost(request: Request, backendPath: string, fields: readonly string[]): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
  const picked = Object.fromEntries(fields.map((field) => [field, (body as Record<string, unknown>)[field]]));
  return jsonFromBackend(await callBackend(backendPath, { method: "POST", body: JSON.stringify(picked), clientIp: clientIpOf(request) }));
}
