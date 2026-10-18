import { create } from "zustand";

export type Theme = "light" | "dark";
export const THEME_KEY = "sew-theme";

type UIStore = {
  sidebarOpen: boolean;
  activeTab: string;
  theme: Theme;
  setSidebarOpen: (value: boolean) => void;
  setActiveTab: (value: string) => void;
  setTheme: (value: Theme) => void;
  toggleTheme: () => void;
};

/** Simpan pilihan tema; gagal menyimpan (mode privat, dsb.) tidak boleh merusak aplikasi. */
function persist(theme: Theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* abaikan */ }
}

// Nilai awal selalu "light" supaya HTML server dan klien sama; ThemeProvider yang menyelaraskan
// dengan pilihan tersimpan / setelan sistem setelah halaman tampil.
export const useUIStore = create<UIStore>((set, get) => ({
  sidebarOpen: true,
  activeTab: "dashboard",
  theme: "light",
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
  setActiveTab: (value) => set({ activeTab: value }),
  setTheme: (value) => { persist(value); set({ theme: value }); },
  toggleTheme: () => get().setTheme(get().theme === "light" ? "dark" : "light"),
}));
