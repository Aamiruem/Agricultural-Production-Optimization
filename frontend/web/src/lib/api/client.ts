import axios, { AxiosError, type AxiosInstance } from "axios";

import { getValidToken, useAuthStore } from "@/store/auth-store";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
export const FARM_API_URL = process.env.NEXT_PUBLIC_FARM_API_URL ?? "http://localhost:4100/api";

const SERVICE_NAMES = new Map([
  [API_URL, "the FastAPI backend (port 8000)"],
  [FARM_API_URL, "the farm service (port 4100)"],
]);

function withAuth(instance: AxiosInstance): AxiosInstance {
  instance.interceptors.request.use((config) => {
    const token = getValidToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  instance.interceptors.response.use(undefined, (error: unknown) => {
    // A rejected token (expired, or the secret rotated): drop the session.
    if (error instanceof AxiosError && error.response?.status === 401 && error.config?.headers?.Authorization) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  });
  return instance;
}

/** Python / FastAPI service: ML, auth, history, assistant. */
export const api = withAuth(
  axios.create({ baseURL: API_URL, timeout: 15_000, headers: { "Content-Type": "application/json" } }),
);

/** Node / Express service: farms, fields, activities, photos. */
export const farmApi = withAuth(
  axios.create({ baseURL: FARM_API_URL, timeout: 15_000, headers: { "Content-Type": "application/json" } }),
);

/** Turn any Axios/FastAPI/Express error into a readable message. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      const service = SERVICE_NAMES.get(error.config?.baseURL ?? API_URL) ?? "the API";
      return `Cannot reach the API. Is ${service} running?`;
    }
    const detail = (error.response.data as { detail?: unknown })?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    return `Request failed with status ${error.response.status}`;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
