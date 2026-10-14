// Google Identity Services (tombol "Masuk dengan Google"). Skrip resmi dimuat dari accounts.google.com.
// Hasilnya berupa ID token (JWT) yang HANYA diteruskan ke backend untuk diverifikasi; tidak disimpan di browser.
type GoogleId = {
  initialize: (cfg: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string; auto_select?: boolean }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
};
declare global {
  interface Window { google?: { accounts: { id: GoogleId } } }
}

const SRC = "https://accounts.google.com/gsi/client";
let loading: Promise<void> | null = null;

export function loadGoogle(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { loading = null; reject(new Error("Gagal memuat skrip Google. Periksa koneksi internet.")); };
    document.head.appendChild(s);
  });
  return loading;
}

export async function renderGoogleButton(el: HTMLElement, clientId: string, onCredential: (credential: string) => void, text: "signin_with" | "signup_with" = "signin_with") {
  await loadGoogle();
  const id = window.google!.accounts.id;
  id.initialize({ client_id: clientId, callback: (r) => { if (r.credential) onCredential(r.credential); }, auto_select: false });
  el.innerHTML = "";
  id.renderButton(el, { type: "standard", theme: "outline", size: "large", text, shape: "pill", logo_alignment: "left", width: Math.min(360, el.clientWidth || 360) });
}
