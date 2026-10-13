import { describe, expect, it } from "vitest";
import { calculateRisk, categorize } from "@/lib/risk";
import { asStudentId, type Student } from "@/lib/types";

const make = (overrides: Partial<Student>): Student => ({
  nim: asStudentId("2024999"),
  name: "Uji",
  prodi: "D3 Teknik Informatika",
  angkatan: 2024,
  attendance: 100,
  gpa: 4,
  lms: 100,
  assignments: 100,
  ...overrides,
});

describe("calculateRisk", () => {
  it("memberi skor 0 dan kategori Rendah untuk indikator sempurna", () => {
    expect(calculateRisk(make({}))).toMatchObject({ score: 0, category: "Rendah" });
  });

  it("memberi skor 100 dan kategori Tinggi untuk indikator nol", () => {
    expect(calculateRisk(make({ attendance: 0, gpa: 0, lms: 0, assignments: 0 }))).toMatchObject({ score: 100, category: "Tinggi" });
  });

  it("cocok dengan data demo di README (Alya 6, Bagas 43, Citra 73, Dimas 30, Eka 41)", () => {
    expect(calculateRisk(make({ attendance: 96, gpa: 3.72, lms: 91, assignments: 94 })).score).toBe(6);
    expect(calculateRisk(make({ attendance: 58, gpa: 2.3, lms: 50, assignments: 60 })).score).toBe(43);
    expect(calculateRisk(make({ attendance: 22, gpa: 1.3, lms: 28, assignments: 25 })).score).toBe(73);
    expect(calculateRisk(make({ attendance: 74, gpa: 2.86, lms: 62, assignments: 68 })).score).toBe(30);
    expect(calculateRisk(make({ attendance: 63, gpa: 2.5, lms: 54, assignments: 52 })).score).toBe(41);
  });

  it("menunjuk faktor dominan dari indikator terburuk", () => {
    expect(calculateRisk(make({ attendance: 10 })).dominantFactor).toBe("Presensi rendah");
    expect(calculateRisk(make({ gpa: 0.5 })).dominantFactor).toBe("IPK rendah");
    expect(calculateRisk(make({ lms: 5 })).dominantFactor).toBe("Aktivitas LMS menurun");
    expect(calculateRisk(make({ assignments: 5 })).dominantFactor).toBe("Pengumpulan tugas rendah");
  });
});

describe("categorize", () => {
  it("memakai batas 40 dan 70", () => {
    expect(categorize(39)).toBe("Rendah");
    expect(categorize(40)).toBe("Sedang");
    expect(categorize(69)).toBe("Sedang");
    expect(categorize(70)).toBe("Tinggi");
  });
});
