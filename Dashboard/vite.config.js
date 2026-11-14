import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

import { iconFontUrl } from "./src/lib/icons.js";

/** Injects the Material Symbols URL, subset to the icons the dashboard declares. */
function iconFont() {
  return { name: "agrismart-icon-font", transformIndexHtml: (html) => html.replace("%ICON_FONT_URL%", iconFontUrl()) };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Dev proxy: one origin for the browser; Vite forwards to each service (no CORS needed).
  const api = env.API_PROXY_TARGET || "http://127.0.0.1:8000";
  const farm = env.FARM_PROXY_TARGET || "http://127.0.0.1:4100";
  const mcp = env.MCP_PROXY_TARGET || "http://127.0.0.1:8100";

  return {
    plugins: [react(), tailwindcss(), iconFont()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    server: {
      port: 5180,
      proxy: {
        "/api": { target: api, changeOrigin: true, ws: true }, // REST, SSE and the live-recommend WebSocket
        "/farm-api/health": { target: farm, changeOrigin: true, rewrite: () => "/health" },
        "/farm-api": { target: farm, changeOrigin: true },
        "/mcp/health": { target: mcp, changeOrigin: true, rewrite: () => "/health" },
        "/mcp": { target: mcp, changeOrigin: true },
      },
    },
    preview: { port: 4180 },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (/recharts|d3-|victory-vendor/.test(id)) return "charts";
            if (/@tanstack/.test(id)) return "query";
            if (/react-dom|react-router|scheduler/.test(id)) return "react";
            return undefined;
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.js"],
      include: ["src/**/*.test.{js,jsx}"],
      css: false,
    },
  };
});
