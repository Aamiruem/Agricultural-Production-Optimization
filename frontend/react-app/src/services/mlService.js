import analytics from "@/data/generated/analytics.json";
import { predictYieldLocal } from "@/lib/agriModels";

import { api, withFallback } from "./apiClient";

/** Served model + training leaderboard produced by `python -m AIML.machine_learning.crop_classifier`. */
export async function fetchModelInfo() {
  const { data } = await api.get("/ml/model");
  return data;
}

/** Predict crop yield with the trained AIML yield regression bundle. */
export function predictYield(payload) {
  return withFallback(
    async () => (await api.post("/yield/predict", payload)).data,
    () => predictYieldLocal(payload),
  );
}

/** Historical state/crop/season coverage from the bundled India dataset. */
export function fetchYieldCoverage() {
  return withFallback(
    async () => (await api.get("/yield/coverage")).data,
    () => ({
      source: "Indian crop-yield dataset bundled with AgriSmart (historical records)",
      first_year: analytics.first_year,
      last_year: analytics.last_year,
      states: Object.keys(analytics.states).sort(),
      crops: Object.keys(analytics.national).sort(),
      seasons: [...new Set(Object.values(analytics.states).flatMap((s) => s.seasonList))].sort(),
      observations: analytics.rows,
    }),
  );
}

/** Yearly weighted yield and production for a selected Indian state. */
export function fetchYieldTrend(params) {
  return withFallback(
    async () => (await api.get("/yield/trend", { params })).data,
    () => {
      const state = analytics.states[params.state];
      const points = (state?.years ?? []).map(([year, area, production]) => ({
        year,
        area_ha: area,
        production_t: production,
        yield_t_ha: area ? Math.round((production / area) * 1000) / 1000 : 0,
      }));
      return {
        ...params,
        crop: "All crops",
        points,
        source_years: points.length ? { first: points[0].year, last: points.at(-1).year } : null,
      };
    },
  );
}

// Admin-only (RBAC)

export async function reloadModel() {
  const { data } = await api.post("/ml/reload");
  return data;
}

export async function fetchAdminUsers() {
  const { data } = await api.get("/admin/users");
  return data;
}
