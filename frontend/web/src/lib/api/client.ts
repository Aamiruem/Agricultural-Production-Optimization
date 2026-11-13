import axios, { AxiosError } from "axios";

/** Axios instance used by client components (browser → FastAPI). */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

/** Turn any Axios/FastAPI error into a readable message. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Cannot reach the API. Is the FastAPI backend running on port 8000?";
    }
    const detail = (error.response.data as { detail?: unknown })?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    return `Request failed with status ${error.response.status}`;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
