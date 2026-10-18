"use client";

import { Moon, Sun } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useUIStore();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
      className={`grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 ${className}`}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
