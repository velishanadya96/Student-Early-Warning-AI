import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { studentSchema } from "@/lib/schemas";
import { studentsDb } from "@/lib/mockDb";
import { asStudentId } from "@/lib/types";
import { scopeToClaims } from "@/lib/server/access";
import { claimsFromRequest } from "@/lib/server/session";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function invalidStudent(error: unknown) {
  const message = error instanceof ZodError ? (error.issues[0]?.message ?? "Data mahasiswa tidak valid.") : "Data mahasiswa tidak valid.";
  return NextResponse.json({ message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const claims = await claimsFromRequest(request);
  if (!claims) return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
  await wait(300);
  return NextResponse.json(scopeToClaims(studentsDb, claims));
}

export async function POST(request: Request) {
  try {
    const parsed = studentSchema.parse(await request.json());
    if (studentsDb.some((student) => student.nim === parsed.nim)) {
      return NextResponse.json({ message: "NIM sudah terdaftar." }, { status: 409 });
    }
    const student = { ...parsed, nim: asStudentId(parsed.nim) };
    studentsDb.push(student);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return invalidStudent(error);
  }
}

export async function PUT(request: Request) {
  try {
    const parsed = studentSchema.parse(await request.json());
    const index = studentsDb.findIndex((student) => student.nim === parsed.nim);
    if (index === -1) return NextResponse.json({ message: "Mahasiswa tidak ditemukan." }, { status: 404 });
    const updated = { ...parsed, nim: asStudentId(parsed.nim) };
    studentsDb[index] = updated;
    return NextResponse.json(updated);
  } catch (error) {
    return invalidStudent(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body: unknown = await request.json();
    const nim = typeof body === "object" && body !== null && "nim" in body ? String(body.nim) : "";
    const index = studentsDb.findIndex((student) => student.nim === nim);
    if (index === -1) return NextResponse.json({ message: "Mahasiswa tidak ditemukan." }, { status: 404 });
    const [deleted] = studentsDb.splice(index, 1);
    return NextResponse.json(deleted);
  } catch {
    return NextResponse.json({ message: "Permintaan hapus tidak valid." }, { status: 400 });
  }
}
