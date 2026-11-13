import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components + Partial Prefetching: static shells, "use cache" (SSG/ISR)
  // and request-time streaming (SSR) in the same app.
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      // Run the Tailwind loader on the global stylesheet only. Matching every
      // "*.css" also catches compiled Sass modules and strips their CSS-module
      // scoping (styles from *.module.scss end up global and unreferenced).
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
