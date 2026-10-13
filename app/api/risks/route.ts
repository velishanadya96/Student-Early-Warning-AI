import { NextResponse, type NextRequest } from "next/server";
import { studentsDb } from "@/lib/mockDb";
import { calculateRisk } from "@/lib/risk";
import { scopeToClaims } from "@/lib/server/access";
import { claimsFromRequest } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  const claims = await claimsFromRequest(request);
  if (!claims) return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
  await new Promise((resolve) => setTimeout(resolve, 400));
  const updatedAt = new Date().toISOString().slice(0, 10);
  const risks = scopeToClaims(studentsDb, claims).map((student) => ({ nim: student.nim, name: student.name, ...calculateRisk(student), updatedAt }));
  return NextResponse.json(risks);
}
