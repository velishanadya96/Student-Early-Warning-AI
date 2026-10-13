import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    strictPort: true,
    host: true,
  },
  build: {
    target: "esnext",
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Bentuk fungsi didukung Rollup dan Rolldown (Vite 8); bentuk objek hanya Rollup.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules[\\/]lucide-react[\\/]/.test(id)) return "icons";
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "vendor";
          return undefined;
        },
      },
    },
  },
});
