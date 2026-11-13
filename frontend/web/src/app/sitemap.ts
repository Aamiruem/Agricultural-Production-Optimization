import type { MetadataRoute } from "next";

import { CROP_NAMES } from "@/lib/crops";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// SEO: /sitemap.xml generated at build time.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/recommend", "/fertilizer", "/crops", "/planner"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const crops = CROP_NAMES.map((name) => ({
    url: `${SITE_URL}/crops/${name}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...crops];
}
