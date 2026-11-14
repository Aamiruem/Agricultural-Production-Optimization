import axios, { AxiosError } from "axios";

import { getValidToken, useAuthStore } from "@/store/authStore";

// Relative URLs go through the Vite dev proxy / Nginx; absolute URLs call services directly.
export const API_URL = import.meta.env.VITE_API_URL ?? "/api";
export const FARM_API_URL = import.meta.env.VITE_FARM_API_URL ?? "/farm-api";

const SERVICE_NAMES = {
  [API_URL]: "the FastAPI backend (port 8000)",
  [FARM_API_URL]: "the Express farm service (port 4100)",
};

function withAuth(instance) {
  // Attach the JWT to every request.
  instance.interceptors.request.use((config) => {
    const token = getValidToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  // A rejected token (expired or revoked): sign the user out.
  instance.interceptors.response.use(undefined, (error) => {
    if (error instanceof AxiosError && error.response?.status === 401 && error.config?.headers?.Authorization) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  });
  return instance;
}

/** Python / FastAPI: ML, auth, history, jobs, assistant. */
export const api = withAuth(axios.create({ baseURL: API_URL, timeout: 15000 }));

/** Node / Express: farms, fields, activities, photos. */
export const farmApi = withAuth(axios.create({ baseURL: FARM_API_URL, timeout: 15000 }));

/**
 * True when the API service itself is unreachable (no server, or a static host
 * answering /api with the SPA shell) rather than rejecting the request.
 */
export function isApiUnavailable(error) {
  if (error?.code === "API_HTML") return true;
  if (!(error instanceof AxiosError)) return false;
  return !error.response || [404, 405, 501, 502, 503, 504].includes(error.response.status);
}

/**
 * Call the backend; if it is unavailable, run the bundled browser model instead.
 * Results from the fallback carry `engine: "browser"` so the UI can label them.
 */
export async function withFallback(remote, local) {
  try {
    const data = await remote();
    if (typeof data === "string") throw Object.assign(new Error("API returned HTML"), { code: "API_HTML" });
    return data;
  } catch (error) {
    if (!isApiUnavailable(error)) throw error;
    const data = await local();
    return Array.isArray(data) || typeof data !== "object" ? data : { engine: "browser", ...data };
  }
}

/** Turn any Axios / FastAPI / Express error into a readable message. */
export function getErrorMessage(error) {
  if (error instanceof AxiosError) {
    if (!error.response || error.response.status === 502 || error.response.status === 504) {
      const service = SERVICE_NAMES[error.config?.baseURL] ?? "the API";
      return `Cannot reach the API. Is ${service} running?`;
    }
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    return `Request failed with status ${error.response.status}`;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
