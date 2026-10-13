import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "@/middleware";

const SECRET = "m".repeat(40);
const key = new TextEncoder().encode(SECRET);

async function jwt(role: string, nim: string | null = null, type = "access", exp = "15m") {
  return new SignJWT({ type, role, nim }).setProtectedHeader({ alg: "HS256" }).setSubject("1").setIssuedAt().setExpirationTime(exp).sign(key);
}

function request(path: string, init: { method?: string; cookies?: Record<string, string>; headers?: Record<string, string> } = {}) {
  const cookie = Object.entries(init.cookies ?? {}).map(([k, v]) => `${k}=${v}`).join("; ");
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? "GET",
    headers: { host: "localhost:3000", ...(cookie ? { cookie } : {}), ...init.headers },
  });
}

beforeEach(() => {
  process.env.JWT_SECRET_KEY = SECRET;
});
afterEach(() => vi.restoreAllMocks());

describe("halaman", () => {
  it("tanpa sesi dialihkan ke /login", async () => {
    const res = await middleware(request("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("cookie lama buatan client (sew_role=admin) tidak lagi diterima", async () => {
    const res = await middleware(request("/dashboard-admin", { cookies: { sew_session: "x", sew_role: "admin" } }));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("token dengan tanda tangan salah ditolak", async () => {
    const forged = await new SignJWT({ type: "access", role: "admin" }).setProtectedHeader({ alg: "HS256" }).setSubject("1").setExpirationTime("15m").sign(new TextEncoder().encode("z".repeat(40)));
    const res = await middleware(request("/dashboard-admin", { cookies: { sew_access: forged } }));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("role yang salah dialihkan ke dashboard miliknya", async () => {
    const res = await middleware(request("/dashboard-admin", { cookies: { sew_access: await jwt("mahasiswa", "2024001") } }));
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard-mahasiswa");
  });

  it("role yang benar diteruskan", async () => {
    const res = await middleware(request("/dashboard-mahasiswa/profil", { cookies: { sew_access: await jwt("mahasiswa", "2024001") } }));
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it("/dashboard hanya untuk dosen dan tidak ikut menangkap /dashboard-admin", async () => {
    expect((await middleware(request("/dashboard", { cookies: { sew_access: await jwt("dosen") } }))).status).toBe(200);
    expect((await middleware(request("/dashboard-admin", { cookies: { sew_access: await jwt("dosen") } }))).headers.get("location")).toBe("http://localhost:3000/dashboard");
  });
});

describe("API", () => {
  it("endpoint publik boleh diakses tanpa sesi", async () => {
    for (const path of ["/api/health", "/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/verify-email", "/api/auth/resend-verification"]) {
      expect((await middleware(request(path, { method: "POST" }))).status).toBe(200);
    }
  });

  it("endpoint data tanpa sesi = 401", async () => {
    expect((await middleware(request("/api/students"))).status).toBe(401);
  });

  it("role tanpa izin menulis = 403, role berizin diteruskan", async () => {
    const mhs = await jwt("mahasiswa", "2024001");
    expect((await middleware(request("/api/students", { method: "DELETE", cookies: { sew_access: mhs } }))).status).toBe(403);
    expect((await middleware(request("/api/users", { cookies: { sew_access: await jwt("dosen") } }))).status).toBe(403);
    expect((await middleware(request("/api/students", { method: "POST", cookies: { sew_access: await jwt("dosen") } }))).status).toBe(200);
    expect((await middleware(request("/api/users", { cookies: { sew_access: await jwt("admin") } }))).status).toBe(200);
  });

  it("permintaan tulis dari origin lain ditolak, termasuk untuk endpoint publik", async () => {
    const res = await middleware(request("/api/auth/login", { method: "POST", headers: { origin: "http://evil.example" } }));
    expect(res.status).toBe(403);
  });
});

describe("refresh otomatis", () => {
  it("access token hilang tetapi refresh token ada: diperbarui dan cookie baru dikirim", async () => {
    const newAccess = await jwt("mahasiswa", "2024001");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ access_token: newAccess }), { status: 200 }));
    const res = await middleware(request("/dashboard-mahasiswa", { cookies: { sew_refresh: await jwt("mahasiswa", "2024001", "refresh", "7d") } }));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/v1/auth/refresh");
    expect(res.status).toBe(200);
    expect(res.cookies.get("sew_access")?.value).toBe(newAccess);
    expect(res.cookies.get("sew_access")?.httpOnly).toBe(true);
  });

  it("refresh ditolak backend (mis. dicabut): dialihkan ke /login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ code: "TOKEN_TIDAK_VALID" }), { status: 401 }));
    const res = await middleware(request("/dashboard-mahasiswa", { cookies: { sew_refresh: "dicabut" } }));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("backend tidak terjangkau saat refresh: gagal tertutup, bukan lolos", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await middleware(request("/api/students", { cookies: { sew_refresh: "x" } }));
    expect(res.status).toBe(401);
  });
});
