import { SignJWT } from "jose";
import { beforeEach, describe, expect, it } from "vitest";
import { secondsUntilExpiry, verifyAccessToken } from "@/lib/server/auth";

const SECRET = "x".repeat(40);
const key = new TextEncoder().encode(SECRET);

async function token(payload: Record<string, unknown>, options: { secret?: Uint8Array; exp?: string } = {}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("7")
    .setIssuedAt()
    .setExpirationTime(options.exp ?? "15m")
    .sign(options.secret ?? key);
}

beforeEach(() => {
  process.env.JWT_SECRET_KEY = SECRET;
});

describe("verifyAccessToken", () => {
  it("menerima token access yang valid dan mengembalikan klaim", async () => {
    const claims = await verifyAccessToken(await token({ type: "access", role: "mahasiswa", nim: "2024001" }));
    expect(claims).toEqual({ id: "7", role: "mahasiswa", nim: "2024001" });
  });

  it("nim kosong menjadi null", async () => {
    expect((await verifyAccessToken(await token({ type: "access", role: "admin", nim: null })))?.nim).toBeNull();
  });

  it("menolak tanda tangan salah (token palsu)", async () => {
    const forged = await token({ type: "access", role: "admin" }, { secret: new TextEncoder().encode("y".repeat(40)) });
    expect(await verifyAccessToken(forged)).toBeNull();
  });

  it("menolak token kedaluwarsa, refresh token, role tak dikenal, dan token kosong", async () => {
    expect(await verifyAccessToken(await token({ type: "access", role: "admin" }, { exp: "-1m" }))).toBeNull();
    expect(await verifyAccessToken(await token({ type: "refresh", role: "admin" }))).toBeNull();
    expect(await verifyAccessToken(await token({ type: "access", role: "superuser" }))).toBeNull();
    expect(await verifyAccessToken(undefined)).toBeNull();
    expect(await verifyAccessToken("bukan.jwt.sama-sekali")).toBeNull();
  });

  it("menolak token alg=none", async () => {
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: "1", role: "admin", type: "access", exp: 9999999999 })).toString("base64url")}.`;
    expect(await verifyAccessToken(none)).toBeNull();
  });
});

describe("secondsUntilExpiry", () => {
  it("menghitung sisa umur token", async () => {
    const seconds = secondsUntilExpiry(await token({ type: "access", role: "admin" }, { exp: "10m" }), 1);
    expect(seconds).toBeGreaterThan(590);
    expect(seconds).toBeLessThanOrEqual(600);
  });

  it("memakai fallback untuk token rusak", () => {
    expect(secondsUntilExpiry("rusak", 42)).toBe(42);
  });
});
