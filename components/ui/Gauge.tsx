import type { Kategori } from "@/lib/types";

const COLOR: Record<Kategori, string> = { High: "#e0583c", Medium: "#e9b949", Low: "#4fbf9a" };

/** Busur setengah lingkaran untuk skor risiko 0..1. */
export function Gauge({ skor, kategori, className = "" }: { skor: number; kategori: Kategori; className?: string }) {
  const v = Math.min(1, Math.max(0, skor));
  const R = 90;
  const len = Math.PI * R;
  return (
    <div className={`relative ${className}`} role="img" aria-label={`Skor risiko ${skor.toFixed(2)} dari 1`}>
      <svg viewBox="0 0 220 130" className="w-full">
        <path d="M20 115 A90 90 0 0 1 200 115" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="18" strokeLinecap="round" />
        <path d="M20 115 A90 90 0 0 1 200 115" fill="none" stroke={COLOR[kategori]} strokeWidth="18" strokeLinecap="round" strokeDasharray={`${len * v} ${len}`} />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <p className="text-5xl font-extrabold leading-none tracking-tight">{skor.toFixed(2)}</p>
      </div>
    </div>
  );
}
