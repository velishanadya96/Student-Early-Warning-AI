import { asStudentId, type Intervention, type Risk, type Student } from "@/lib/types";
import { interventionRecordSchema, interventionSchema, riskSchema, studentSchema } from "@/lib/schemas";
import { z } from "zod";

const studentOptionSchema = z.object({ nim: z.string(), name: z.string() });
export type StudentOption = { nim: string; name: string };

async function parseResponse(response: Response): Promise<unknown> {
  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // Body kosong atau bukan JSON; ditangani lewat status di bawah.
  }
  if (!response.ok) {
    const message = typeof json === "object" && json !== null && "message" in json ? String(json.message) : "Terjadi kesalahan pada server.";
    throw new Error(message);
  }
  return json;
}

function toStudent(item: unknown): Student {
  const parsed = studentSchema.parse(item);
  return { ...parsed, nim: asStudentId(parsed.nim) };
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export async function fetchStudents(): Promise<Student[]> {
  const json = await parseResponse(await fetch("/api/students"));
  if (!Array.isArray(json)) throw new Error("Format data mahasiswa tidak valid.");
  return json.map(toStudent);
}

/** Daftar NIM + nama saja. Satu-satunya data mahasiswa yang boleh dibaca sebelum login. */
export async function fetchStudentOptions(): Promise<StudentOption[]> {
  const json = await parseResponse(await fetch("/api/students/lookup"));
  if (!Array.isArray(json)) throw new Error("Format daftar mahasiswa tidak valid.");
  return json.map((item) => studentOptionSchema.parse(item));
}

export async function createStudent(payload: Student): Promise<Student> {
  const valid = studentSchema.parse(payload);
  return toStudent(await parseResponse(await fetch("/api/students", jsonRequest("POST", valid))));
}

export async function updateStudent(payload: Student): Promise<Student> {
  const valid = studentSchema.parse(payload);
  return toStudent(await parseResponse(await fetch("/api/students", jsonRequest("PUT", valid))));
}

export async function deleteStudent(nim: string): Promise<void> {
  await parseResponse(await fetch("/api/students", jsonRequest("DELETE", { nim })));
}

export async function fetchRisks(): Promise<Risk[]> {
  const json = await parseResponse(await fetch("/api/risks"));
  if (!Array.isArray(json)) throw new Error("Format risk score tidak valid.");
  return json.map((item) => {
    const parsed = riskSchema.parse(item);
    return { ...parsed, nim: asStudentId(parsed.nim) };
  });
}

function toIntervention(item: unknown): Intervention {
  const parsed = interventionRecordSchema.parse(item);
  return { ...parsed, nim: asStudentId(parsed.nim) };
}

export async function fetchInterventions(): Promise<Intervention[]> {
  const json = await parseResponse(await fetch("/api/interventions"));
  if (!Array.isArray(json)) throw new Error("Format intervensi tidak valid.");
  return json.map(toIntervention);
}

export async function createIntervention(payload: { nim: string; note: string }): Promise<Intervention> {
  const valid = interventionSchema.parse(payload);
  return toIntervention(await parseResponse(await fetch("/api/interventions", jsonRequest("POST", valid))));
}
