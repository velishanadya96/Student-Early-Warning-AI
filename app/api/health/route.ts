import { NextResponse } from "next/server";

/** Cek kesehatan untuk Docker/load balancer. Tidak membuka data apa pun. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}

export const dynamic = "force-dynamic";
