import { useCallback } from "react";

import { useAuthStore } from "@/store/authStore";

/**
 * Sign out from inside the private app and land on the public home page.
 *
 * A client-side navigate("/") loses the race against the route guard (React Router runs
 * navigation as a transition, the guard's redirect to /login wins), so this clears the
 * stored session and then loads "/" fresh — which also drops every in-memory cache
 * (React Query, Redux) that may hold the previous user's data.
 */
export function useSignOut() {
  const logout = useAuthStore((s) => s.logout);
  return useCallback(() => {
    logout(); // persisted synchronously to localStorage
    window.location.replace("/");
  }, [logout]);
}
