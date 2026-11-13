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

/** React hook: the current user (null when signed out or expired). */
export function useSession() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const valid = Boolean(token) && expiresAt > Date.now();
  return { token: valid ? token : null, user: valid ? user : null, isAdmin: valid && user?.role === "admin" };
}
