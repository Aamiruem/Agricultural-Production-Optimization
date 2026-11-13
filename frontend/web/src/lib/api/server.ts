import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";

import type { Crop } from "./types";

// Server-side data access with the native Fetch API (runs only on the server).

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/** Marks the caller as request-time (SSR) work; never prerendered at build. */
export const requestTime = connection;

/**
 * SSR: fetched fresh on every request. Callers must `await connection()`
 * first (see requestTime below) so the work belongs to request time.
 */
export async function getCropsFresh(): Promise<Crop[]> {
  const res = await fetch(`${API_URL}/crops`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API responded with ${res.status}`);
  return res.json();
}

/**
 * SSG + ISR: the result is cached and reused across requests and builds.
 * Successful responses live for days; failures are cached only briefly
 * so the page recovers as soon as the backend is back.
 */
export async function getCropCached(name: string): Promise<Crop | null> {
  "use cache";
  cacheTag(`crop-${name}`);

  try {
    const res = await fetch(`${API_URL}/crops/${encodeURIComponent(name)}`);
    if (!res.ok) {
      cacheLife("minutes");
      return null;
    }
    cacheLife("days");
    return (await res.json()) as Crop;
  } catch {
    cacheLife("minutes");
    return null;
  }
}
