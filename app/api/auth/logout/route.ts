import { NextResponse } from "next/server";
import { clearAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuth(res);
  return res;
}
