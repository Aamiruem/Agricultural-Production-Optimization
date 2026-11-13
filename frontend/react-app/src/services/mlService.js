import { api } from "./apiClient";

/** Served model + training leaderboard produced by `python -m ml.train`. */
export async function fetchModelInfo() {
  const { data } = await api.get("/ml/model");
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
