import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { interventionSchema } from "@/lib/schemas";
import { interventionsDb, nextInterventionId, studentsDb } from "@/lib/mockDb";
import { scopeToClaims } from "@/lib/server/access";
import { claimsFromRequest } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  const claims = await claimsFromRequest(request);
  if (!claims) return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
  await new Promise((resolve) => setTimeout(resolve, 350));
  return NextResponse.json(scopeToClaims(interventionsDb, claims));
}

export async function POST(request: Request) {
  try {
    const parsed = interventionSchema.parse(await request.json());
    if (!studentsDb.some((student) => student.nim === parsed.nim)) {
      return NextResponse.json({ message: "NIM tidak ditemukan pada data mahasiswa." }, { status: 404 });
    }
    const item = {
      id: nextInterventionId(),
      nim: parsed.nim,
      note: parsed.note,
      date: new Date().toISOString().slice(0, 10),
    };
    interventionsDb.unshift(item);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof ZodError ? (error.issues[0]?.message ?? "Catatan tindak lanjut tidak valid.") : "Catatan tindak lanjut tidak valid.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
