import { api } from "./apiClient";

export async function register({ email, password, full_name }) {
  const { data } = await api.post("/auth/register", { email, password, full_name });
  return data;
}

/** OAuth 2.0 password grant: form-encoded `username` + `password`. */
export async function login(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const { data } = await api.post("/auth/token", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  await api.post("/auth/reset-password", { token, password });
}

export async function changePassword(current_password, new_password) {
  await api.post("/auth/change-password", { current_password, new_password });
}

export async function updateProfile(full_name) {
  const { data } = await api.patch("/auth/me", { full_name });
  return data;
}
