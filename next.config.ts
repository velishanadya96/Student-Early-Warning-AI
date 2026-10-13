import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Next.js memakai skrip/gaya inline, jadi CSP belum bisa menolak 'unsafe-inline' tanpa nonce per request.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // Dockerfile menyetel DOCKER_BUILD=1 untuk membuat server mandiri (folder .next/standalone).
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  // Kunci root proyek ke folder ini supaya Next tidak salah memilih package-lock.json di folder induk.
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
