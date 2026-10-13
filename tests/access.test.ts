import { describe, expect, it } from "vitest";
import { isRoleAllowed, isSameOrigin, scopeToClaims } from "@/lib/server/access";
import type { Claims } from "@/lib/server/auth";

const claims = (role: Claims["role"], nim: string | null = null): Claims => ({ id: "1", role, nim });
const rows = [{ nim: "2024001" }, { nim: "2024002" }];

describe("isRoleAllowed", () => {
  it("semua role boleh membaca data mahasiswa, tetapi hanya dosen/admin yang boleh mengubah", () => {
    expect(isRoleAllowed("/api/students", "GET", "mahasiswa")).toBe(true);
    expect(isRoleAllowed("/api/students", "DELETE", "mahasiswa")).toBe(false);
    expect(isRoleAllowed("/api/students", "POST", "kaprodi")).toBe(false);
    expect(isRoleAllowed("/api/students", "PUT", "dosen")).toBe(true);
    expect(isRoleAllowed("/api/students", "POST", "admin")).toBe(true);
  });

  it("catatan tindak lanjut hanya ditulis Dosen PA", () => {
    expect(isRoleAllowed("/api/interventions", "POST", "dosen")).toBe(true);
    expect(isRoleAllowed("/api/interventions", "POST", "admin")).toBe(false);
    expect(isRoleAllowed("/api/interventions", "GET", "mahasiswa")).toBe(true);
  });

  it("manajemen pengguna hanya Admin, termasuk sub-path dan metode baca", () => {
    expect(isRoleAllowed("/api/users", "GET", "dosen")).toBe(false);
    expect(isRoleAllowed("/api/users/5", "PUT", "mahasiswa")).toBe(false);
    expect(isRoleAllowed("/api/users", "GET", "admin")).toBe(true);
    expect(isRoleAllowed("/api/users/5", "DELETE", "admin")).toBe(true);
  });

  it("endpoint lain tidak dibatasi per role (cukup login)", () => {
    expect(isRoleAllowed("/api/risks", "GET", "orangtua")).toBe(true);
  });
});

describe("scopeToClaims", () => {
  it("mahasiswa dan orang tua hanya melihat NIM miliknya", () => {
    expect(scopeToClaims(rows, claims("mahasiswa", "2024001"))).toEqual([{ nim: "2024001" }]);
    expect(scopeToClaims(rows, claims("orangtua", "2024002"))).toEqual([{ nim: "2024002" }]);
  });

  it("akun tanpa NIM tidak melihat apa pun", () => {
    expect(scopeToClaims(rows, claims("mahasiswa", null))).toEqual([]);
  });

  it("dosen, kaprodi, dan admin melihat semuanya", () => {
    for (const role of ["dosen", "kaprodi", "admin"] as const) expect(scopeToClaims(rows, claims(role))).toHaveLength(2);
  });
});

describe("isSameOrigin", () => {
  it("menolak origin berbeda dan menerima request tanpa origin", () => {
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
    expect(isSameOrigin("http://evil.example", "localhost:3000")).toBe(false);
    expect(isSameOrigin(null, "localhost:3000")).toBe(true);
    expect(isSameOrigin("bukan-url", "localhost:3000")).toBe(false);
  });
});
