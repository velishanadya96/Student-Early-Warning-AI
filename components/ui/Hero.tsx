import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** Tile hero besar: kalimat utama + tombol aksi + visual (radar / gauge) di kanan. */
export function Hero({
  eyebrow, title, accent, children, visual, visualPos = "radar", action, className = "",
}: {
  eyebrow: string; title: string; accent?: string; children?: React.ReactNode; visual?: React.ReactNode; visualPos?: "radar" | "gauge";
  action?: { href: string; label: string }; className?: string;
}) {
  return (
    <div className={`hero p-6 sm:p-8 ${className}`}>
      <div className={`relative z-[1] flex flex-col justify-between gap-6 sm:h-full sm:min-h-[200px] sm:min-w-0 ${visual ? (visualPos === "gauge" ? "sm:max-w-[56%]" : "max-w-[62%] sm:max-w-[50%]") : ""}`}>
        <div>
          <p className="hero-muted text-sm font-semibold">{eyebrow}</p>
          <h1 className="mt-2 text-[2rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            {title} {accent && <span className="hero-accent">{accent}</span>}
          </h1>
          {children && <div className="hero-muted mt-3 max-w-md text-sm leading-6">{children}</div>}
        </div>
        {action && (
          <div>
            <Link href={action.href} className="hero-btn">{action.label}<span className="go"><ArrowRight size={14} /></span></Link>
          </div>
        )}
      </div>
      {visual && visualPos === "radar" && <div className="pointer-events-none absolute -bottom-12 -right-20 w-[66%] max-w-[420px] sm:-bottom-16 sm:-right-16 sm:w-[62%] lg:-bottom-12 lg:-right-10 lg:w-[56%]">{visual}</div>}
      {visual && visualPos === "gauge" && <div className="relative z-[1] mx-auto mt-2 w-full max-w-[300px] sm:absolute sm:right-8 sm:top-1/2 sm:mt-0 sm:w-[36%] sm:-translate-y-1/2">{visual}</div>}
    </div>
  );
}
