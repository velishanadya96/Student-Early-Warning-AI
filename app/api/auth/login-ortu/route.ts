import { proxyLogin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const POST = (req: Request) => proxyLogin("/auth/login-ortu", req);
