import { api } from "./apiClient";

/** Served model + training leaderboard produced by `python -m ml.train`. */
export async function fetchModelInfo() {
  const { data } = await api.get("/ml/model");
  return data;
}

/** Predict crop yield with the trained AIML yield regression bundle. */
export async function predictYield(payload) {
  const { data } = await api.post("/yield/predict", payload);
  return data;
}

/** Historical state/crop/season coverage from the bundled India dataset. */
export async function fetchYieldCoverage() {
  const { data } = await api.get("/yield/coverage");
  return data;
}

/** Yearly weighted yield and production for a selected Indian state. */
export async function fetchYieldTrend(params) {
  const { data } = await api.get("/yield/trend", { params });
  return data;
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
