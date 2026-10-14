// Alamat backend Flask. Boleh ditulis dengan atau tanpa "/api/v1" di belakangnya.
// Server (route handler Next) membaca API_URL kalau ada, kalau tidak NEXT_PUBLIC_API_URL.
export function apiBase(raw: string | undefined): string {
  const base = (raw && raw.trim()) || "http://127.0.0.1:5000";
  return `${base.replace(/\/+$/, "").replace(/\/api\/v1$/, "")}/api/v1`;
}
