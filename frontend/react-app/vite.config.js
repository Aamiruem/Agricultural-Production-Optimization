import react from "@vitejs/plugin-react";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

import { iconFontUrl } from "./src/lib/icons.js";
import { breadcrumbTrail, heroUrl, SEO_ROUTES } from "./src/seo/routes.js";
import { structuredData } from "./src/seo/structuredData.js";

// Browser support: every evergreen browser plus the last ~4 years of Safari/iOS,
// Samsung Internet and Android WebView (ES2020 + CSS lowered for these engines).
const BROWSER_TARGETS = ["es2020", "chrome87", "edge88", "firefox78", "safari14", "ios14"];

/** Injects the Material Symbols URL, subset to the icons the app declares. */
function iconFont() {
  return { name: "agrismart-icon-font", transformIndexHtml: (html) => html.replace("%ICON_FONT_URL%", iconFontUrl()) };
}

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Replace the first tag matching `re` in `html`; fail the build if the template changed. */
function swap(html, re, value, what) {
  if (!re.test(html)) throw new Error(`seoPages: could not find ${what} in index.html`);
  return html.replace(re, () => value);
}

const meta = (attr, key) => new RegExp(`<meta\\s+${attr}="${key}"[\\s\\S]*?/>`);

const NOSCRIPT_LINKS = [
  ["/", "Home"],
  ["/about", "About"],
  ["/agricultural-production-systems", "Agriculture"],
  ["/smart-agricultural-machines", "Smart Machines"],
  ["/ai-in-agriculture", "AI Solutions"],
  ["/crops-and-food", "Crops &amp; Food"],
  ["/farmer-health", "Healthcare"],
  ["/food-and-nutrition", "Nutrition"],
  ["/farmer-education", "Farmer Education"],
  ["/projects", "Projects"],
  ["/contact", "Contact"],
];

/** HTML <head> (and noscript) for one route, derived from the SEO registry. */
function renderHead(template, siteUrl, route, { notFound = false } = {}) {
  const url = `${siteUrl}${route.path === "/" ? "/" : route.path}`;
  const image = `${siteUrl}${route.image}`;
  const robots = route.noindex || notFound ? "noindex,follow" : "index,follow,max-image-preview:large";
  const hero = heroUrl(route);
  let preload = "";
  if (hero?.endsWith("-1200.webp")) {
    preload = `<link rel="preload" as="image" href="${hero}" imagesrcset="${hero.replace("-1200.", "-640.")} 640w, ${hero} 1200w" imagesizes="100vw" fetchpriority="high" />`;
  } else if (hero) {
    preload = `<link rel="preload" as="image" href="${hero}" fetchpriority="high" />`;
  }
  const ld = notFound ? null : structuredData(siteUrl, route.path);
  const trail = breadcrumbTrail(route.path);

  let html = template;
  html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`, "<title>");
  html = swap(html, meta("name", "description"), `<meta name="description" content="${esc(route.description)}" />`, "description");
  html = swap(html, meta("name", "robots"), `<meta name="robots" content="${robots}" />`, "robots");
  html = swap(html, /<link rel="canonical"[\s\S]*?\/>/, notFound ? "" : `<link rel="canonical" href="${esc(url)}" />`, "canonical");
  html = swap(html, meta("property", "og:type"), `<meta property="og:type" content="${route.type === "Article" ? "article" : "website"}" />`, "og:type");
  html = swap(html, meta("property", "og:title"), `<meta property="og:title" content="${esc(route.title)}" />`, "og:title");
  html = swap(html, meta("property", "og:description"), `<meta property="og:description" content="${esc(route.description)}" />`, "og:description");
  html = swap(html, meta("property", "og:url"), `<meta property="og:url" content="${esc(url)}" />`, "og:url");
  html = swap(html, meta("property", "og:image"), `<meta property="og:image" content="${esc(image)}" />`, "og:image");
  html = swap(html, meta("name", "twitter:title"), `<meta name="twitter:title" content="${esc(route.title)}" />`, "twitter:title");
  html = swap(html, meta("name", "twitter:description"), `<meta name="twitter:description" content="${esc(route.description)}" />`, "twitter:description");
  html = swap(html, meta("name", "twitter:image"), `<meta name="twitter:image" content="${esc(image)}" />`, "twitter:image");
  html = swap(html, /<!--seo:preload-->/, preload, "preload marker");
  html = swap(
    html,
    /<script type="application\/ld\+json" id="ld-page">[\s\S]*?<\/script>/,
    ld ? `<script type="application/ld+json" id="ld-page">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : "",
    "JSON-LD",
  );
  // Crawlable fallback text and links for clients that do not run JavaScript.
  const crumbs = trail.length > 1 ? `<p>${trail.map((c) => `<a href="${c.path}">${esc(c.name)}</a>`).join(" › ")}</p>` : "";
  const links = NOSCRIPT_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join(" · ");
  html = swap(
    html,
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript>${crumbs}<h1>${esc(route.title.split(/ [–|] /)[0])}</h1><p>${esc(route.description)}</p><p>${links}</p></noscript>`,
    "noscript",
  );
  return html;
}

/**
 * Build-time SEO: writes a static HTML file per route (dist/<path>.html, served with
 * Vercel cleanUrls), a 404.html, sitemap.xml with image entries and robots.txt.
 */
function seoPages(siteUrl) {
  let outDir = "dist";
  return {
    name: "agrismart-seo-pages",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const root = path.resolve(outDir);
      const template = readFileSync(path.join(root, "index.html"), "utf8");
      for (const route of SEO_ROUTES) {
        const file = route.path === "/" ? "index.html" : `${route.path.slice(1)}.html`;
        mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        writeFileSync(path.join(root, file), renderHead(template, siteUrl, route));
      }
      const notFound = {
        path: "/404",
        title: "Page not found | AgriSmart",
        description:
          "This page does not exist. Explore agricultural production systems, smart machines, AI in agriculture and free farming tools on AgriSmart.",
        image: "/og/home.jpg",
        type: "WebPage",
      };
      writeFileSync(path.join(root, "404.html"), renderHead(template, siteUrl, notFound, { notFound: true }));

      const indexable = SEO_ROUTES.filter((r) => !r.noindex);
      const urls = indexable
        .map((r) => {
          const hero = heroUrl(r);
          const img = hero ? `\n    <image:image><image:loc>${siteUrl}${hero}</image:loc></image:image>` : "";
          return `  <url>\n    <loc>${siteUrl}${r.path === "/" ? "/" : r.path}</loc>\n    <lastmod>${r.updated}</lastmod>${img}\n  </url>`;
        })
        .join("\n");
      writeFileSync(
        path.join(root, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`,
      );
      writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
      console.log(`seo: wrote ${SEO_ROUTES.length} page heads, 404.html, sitemap.xml (${indexable.length} URLs), robots.txt`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Canonical site URL for SEO tags, sitemap and robots.txt (set VITE_SITE_URL in Vercel).
  const siteUrl = (
    env.VITE_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    "https://agrismart-two-iota.vercel.app"
  ).replace(/\/$/, "");
  process.env.VITE_SITE_URL = siteUrl;
  // Dev proxy: the browser talks to one origin (localhost:5173) and Vite forwards
  // requests to the services, so no CORS setup is needed during development.
  const apiTarget = env.API_PROXY_TARGET || "http://localhost:8000";
  const farmTarget = env.FARM_PROXY_TARGET || "http://localhost:4100";

  return {
    plugins: [react(), iconFont(), seoPages(siteUrl)],
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
      target: BROWSER_TARGETS,
      cssTarget: BROWSER_TARGETS,
      rollupOptions: {
        output: {
          // Split large vendor libraries into their own cacheable chunks.
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (/react-bootstrap|@restart|bootstrap/.test(id)) return "bootstrap";
            if (/socket\.io|engine\.io/.test(id)) return "realtime"; // farms page only, not every page
            if (/@tanstack|axios/.test(id)) return "data";
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
