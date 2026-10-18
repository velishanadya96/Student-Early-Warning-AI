"use client";

import { useEffect } from "react";
import { THEME_KEY, useUIStore, type Theme } from "@/store/useUIStore";

/**
 * Skrip kecil yang dijalankan SEBELUM halaman dicat (disisipkan di <head>), supaya tidak ada kilatan
 * terang saat pengguna memilih mode gelap. Urutan: pilihan tersimpan -> setelan sistem -> terang.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  // Sinkronkan store dengan kelas yang sudah dipasang skrip di <head> (sekali saat mount).
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* abaikan */ }
    const initial: Theme = saved === "dark" || saved === "light" ? saved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    useUIStore.setState({ theme: initial });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return <>{children}</>;
}
