import type { RiskCategory, Student } from "@/lib/types";

export type RiskResult = {
  score: number;
  category: RiskCategory;
  dominantFactor: string;
};

export const HIGH_RISK_THRESHOLD = 70;
export const MEDIUM_RISK_THRESHOLD = 40;

/** Bobot tiap indikator terhadap risk score (total harus 1). */
const WEIGHTS = { attendance: 0.3, gpa: 0.3, lms: 0.2, assignments: 0.2 } as const;

export function categorize(score: number): RiskCategory {
  if (score >= HIGH_RISK_THRESHOLD) return "Tinggi";
  if (score >= MEDIUM_RISK_THRESHOLD) return "Sedang";
  return "Rendah";
}

/**
 * Risk score berbasis aturan (rule-based) dengan bobot tetap, bukan model ML.
 * Satu-satunya tempat rumus ini ditulis, dipakai server (API, RSC) dan client.
 */
export function calculateRisk(student: Student): RiskResult {
  const attendanceRisk = 100 - student.attendance;
  const gpaRisk = 100 - (student.gpa / 4) * 100;
  const lmsRisk = 100 - student.lms;
  const assignmentRisk = 100 - student.assignments;

  const score = Math.round(
    attendanceRisk * WEIGHTS.attendance +
      gpaRisk * WEIGHTS.gpa +
      lmsRisk * WEIGHTS.lms +
      assignmentRisk * WEIGHTS.assignments,
  );

  const factors: Array<[number, string]> = [
    [attendanceRisk, "Presensi rendah"],
    [gpaRisk, "IPK rendah"],
    [lmsRisk, "Aktivitas LMS menurun"],
    [assignmentRisk, "Pengumpulan tugas rendah"],
  ];
  factors.sort((a, b) => b[0] - a[0]);

  return {
    score,
    category: categorize(score),
    dominantFactor: factors[0]?.[1] ?? "Tidak ada faktor dominan",
  };
}

export type BadgeVariant = "low" | "medium" | "high";
export type CardTone = "red" | "default" | "blue";

export function badgeVariantFor(category: RiskCategory): BadgeVariant {
  return category === "Tinggi" ? "high" : category === "Sedang" ? "medium" : "low";
}

export function cardToneFor(category: RiskCategory): CardTone {
  return category === "Tinggi" ? "red" : category === "Sedang" ? "default" : "blue";
}
