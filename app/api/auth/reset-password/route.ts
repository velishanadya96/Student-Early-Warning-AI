import type { NextRequest } from "next/server";
import { proxyPublicPost } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  return proxyPublicPost(request, "/auth/reset-password", ["token", "password"]);
}
