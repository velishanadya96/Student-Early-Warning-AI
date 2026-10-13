import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIStore = {
  sidebarOpen: boolean;
  activeTab: string;
  theme: "light" | "dark";
  setSidebarOpen: (value: boolean) => void;
  setActiveTab: (value: string) => void;
  toggleTheme: () => void;
};

/**
 * Hanya `theme` yang disimpan di localStorage. `skipHydration` mencegah ketidakcocokan HTML server
 * dan client; AppShell memanggil `useUIStore.persist.rehydrate()` setelah mount.
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeTab: "dashboard",
      theme: "light",
      setSidebarOpen: (value) => set({ sidebarOpen: value }),
      setActiveTab: (value) => set({ activeTab: value }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
    }),
    { name: "sew_ui", partialize: (state) => ({ theme: state.theme }), skipHydration: true },
  ),
);
