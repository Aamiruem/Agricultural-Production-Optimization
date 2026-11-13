import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

import { iconFontUrl } from "./src/lib/icons.js";

// Public routes listed in sitemap.xml (SEO).
const SITEMAP_ROUTES = [
  ["/", "1.0", "weekly"], ["/dashboard", "0.9", "daily"], ["/crop-recommendation", "0.9", "monthly"], ["/yield-prediction", "0.9", "monthly"],
  ["/soil-analysis", "0.8", "monthly"], ["/weather", "0.8", "hourly"], ["/fertilizer", "0.8", "monthly"], ["/irrigation-optimization", "0.8", "monthly"],
  ["/disease-detection", "0.8", "monthly"], ["/reports", "0.7", "monthly"], ["/crops", "0.8", "monthly"], ["/states", "0.8", "monthly"],
  ["/soil-types", "0.7", "monthly"], ["/crop-gallery", "0.8", "monthly"], ["/seasonal-advisor", "0.8", "monthly"], ["/rotation-planner", "0.7", "monthly"], ["/assistant", "0.6", "monthly"], ["/planner", "0.5", "monthly"], ["/about", "0.5", "yearly"], ["/contact", "0.5", "yearly"],
];

/** Injects the Material Symbols URL, subset to the icons the app declares. */
function iconFont() {
  return { name: "agrismart-icon-font", transformIndexHtml: (html) => html.replace("%ICON_FONT_URL%", iconFontUrl()) };
}

/** Emits sitemap.xml and robots.txt for the configured site URL at build time. */
function seoFiles(siteUrl) {
  return {
    name: "agrismart-seo-files",
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls = SITEMAP_ROUTES.map(([path, priority, freq]) => `  <url><loc>${siteUrl}${path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`).join("\n");
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
` });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *
Allow: /
Disallow: /admin
Disallow: /farms

Sitemap: ${siteUrl}/sitemap.xml
` });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Canonical site URL for SEO tags, sitemap and robots.txt (set VITE_SITE_URL in Vercel).
  const siteUrl = (env.VITE_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || "https://agrismart-india.vercel.app").replace(/\/$/, "");
  process.env.VITE_SITE_URL = siteUrl;
  // Dev proxy: the browser talks to one origin (localhost:5173) and Vite forwards
  // requests to the services, so no CORS setup is needed during development.
  const apiTarget = env.API_PROXY_TARGET || "http://localhost:8000";
  const farmTarget = env.FARM_PROXY_TARGET || "http://localhost:4100";

  return {
    plugins: [react(), iconFont(), seoFiles(siteUrl)],
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
            if (/recharts|d3-|victory-vendor/.test(id)) return "charts";
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
