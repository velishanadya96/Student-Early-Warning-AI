import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node", // komponen React memakai docblock `@vitest-environment jsdom`
    coverage: {
      provider: "v8",
      include: ["lib/**", "middleware.ts", "hooks/**", "components/auth/**"],
      reporter: ["text-summary", "text"],
    },
  },
});
