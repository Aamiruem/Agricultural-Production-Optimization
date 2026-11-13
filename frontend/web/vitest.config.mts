import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Vitest: component + store tests in jsdom (src/**/*.test.ts[x]).
// JSX is compiled by Vite's built-in transform using tsconfig's "jsx": "react-jsx".
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
