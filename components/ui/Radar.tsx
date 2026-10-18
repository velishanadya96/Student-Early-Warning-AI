import { GraduationCap } from "lucide-react";

export type RadarLevel = "high" | "medium" | "low";

// Posisi titik dibuat deterministik (sudut emas + jarak per level) supaya tidak berubah tiap render.
function place(i: number, level: RadarLevel) {
  const angle = (i * 137.508 + 20) * (Math.PI / 180);
  const base = level === "high" ? 0.3 : level === "medium" ? 0.54 : 0.78;
  const jitter = ((i * 37) % 13) / 100;
  const r = Math.min(0.9, base + jitter);
  return { left: `${50 + Math.cos(angle) * r * 50}%`, top: `${50 + Math.sin(angle) * r * 50}%` };
}

const DOT: Record<RadarLevel, string> = { high: "#ff6b4a", medium: "#e9b949", low: "var(--radar-ok)" };

/** Radar risiko: tiap titik = satu mahasiswa. Merah dekat pusat = perlu perhatian. */
export function Radar({ levels, className = "" }: { levels: RadarLevel[]; className?: string }) {
  const shown = levels.slice(0, 40);
  return (
    <div
      role="img"
      aria-label={`Radar risiko: ${levels.filter((l) => l === "high").length} tinggi, ${levels.filter((l) => l === "medium").length} sedang, ${levels.filter((l) => l === "low").length} rendah`}
      className={`relative aspect-square overflow-hidden rounded-full ${className}`}
      style={{
        background: "radial-gradient(circle at 50% 50%, var(--radar-1), var(--radar-2) 55%, var(--radar-3) 100%)",
        border: "1px solid var(--radar-line)",
        boxShadow: "inset -20px -26px 50px rgba(0,0,0,.3), 0 30px 50px -26px rgba(2,16,36,.6)",
      }}
    >
      {[0.34, 0.62].map((s) => (
        <span key={s} aria-hidden="true" className="absolute rounded-full" style={{ inset: `${(1 - s) * 50}%`, border: "1px solid var(--radar-line)" }} />
      ))}
      <span aria-hidden="true" className="absolute left-1/2 top-0 h-full w-px" style={{ background: "var(--radar-line)" }} />
      <span aria-hidden="true" className="absolute left-0 top-1/2 h-px w-full" style={{ background: "var(--radar-line)" }} />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(from 0deg, transparent 0 78%, var(--radar-sweep) 100%)", animation: "sweep 7s linear infinite" }}
      />
      {shown.map((level, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            ...place(i, level),
            width: level === "high" ? 16 : 11,
            height: level === "high" ? 16 : 11,
            background: DOT[level],
            boxShadow: level === "high" ? "0 0 0 6px rgba(255,107,74,.25)" : "none",
            animation: level === "high" ? "pulse-dot 2s ease-in-out infinite" : undefined,
          }}
        />
      ))}
      <span aria-hidden="true" className="absolute left-1/2 top-1/2 grid h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ background: "var(--radar-hub-bg)", color: "var(--radar-hub-fg)" }}>
        <GraduationCap className="h-1/2 w-1/2" />
      </span>
    </div>
  );
}
