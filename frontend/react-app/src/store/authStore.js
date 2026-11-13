import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Zustand: the signed-in session. The JWT is issued by FastAPI and accepted by
// the Node farm-service too.
export const useAuthStore = create()(
  persist(
    (set) => ({
      token: null,
      user: null,
      expiresAt: null,
      setSession: (res) =>
        set({ token: res.access_token, user: res.user, expiresAt: Date.now() + res.expires_in * 1000 }),
      logout: () => set({ token: null, user: null, expiresAt: null }),
    }),
    { name: "agri-auth" },
  ),
);

/** Token if present and not expired (usable outside React, e.g. in Axios). */
export function getValidToken() {
  const { token, expiresAt } = useAuthStore.getState();
  return token && expiresAt > Date.now() ? token : null;
}

/** React hook: the current user (null when signed out). Expiry is enforced by useSessionExpiry. */
export function useSession() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return { token, user: token ? user : null, isAdmin: Boolean(token) && user?.role === "admin" };
}

/** Signs the user out when the JWT expires (and right away if a stored one already has). */
export function useSessionExpiry() {
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const logout = useAuthStore((s) => s.logout);
  useEffect(() => {
    if (!expiresAt) return undefined;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      logout();
      return undefined;
    }
    const timer = setTimeout(logout, Math.min(remaining, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [expiresAt, logout]);
}
