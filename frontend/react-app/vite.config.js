import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Dev proxy: the browser talks to one origin (localhost:5173) and Vite forwards
  // requests to the services, so no CORS setup is needed during development.
  const apiTarget = env.API_PROXY_TARGET || "http://localhost:8000";
  const farmTarget = env.FARM_PROXY_TARGET || "http://localhost:4000";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    css: {
      preprocessorOptions: {
        // Bootstrap's own Sass still uses @import internally; hide its warnings.
        scss: { quietDeps: true, silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"] },
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true, ws: true }, // REST, SSE and WebSocket
        "/farm-api": { target: farmTarget, changeOrigin: true },
        "/socket.io": { target: farmTarget, changeOrigin: true, ws: true },
      },
    },
    preview: { port: 4173 },
    build: {
      rollupOptions: {
        output: {
          // Split large vendor libraries into their own cacheable chunks.
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (/react-bootstrap|@restart|bootstrap/.test(id)) return "bootstrap";
            if (/@tanstack|axios|socket\.io|engine\.io/.test(id)) return "data";
            if (/react-markdown|micromark|mdast|hast|unified|remark/.test(id)) return "markdown";
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
