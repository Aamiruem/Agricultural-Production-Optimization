import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthUser, TokenResponse } from "@/lib/api/types";

// Zustand: the signed-in session (JWT from FastAPI, also accepted by the Node service).

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  expiresAt: number | null; // epoch ms
  hydrated: boolean;
  setSession: (res: TokenResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      expiresAt: null,
      hydrated: false,
      setSession: (res) =>
        set({ token: res.access_token, user: res.user, expiresAt: Date.now() + res.expires_in * 1000 }),
      logout: () => set({ token: null, user: null, expiresAt: null }),
    }),
    {
      name: "agri-auth",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // rehydrated in <Providers> to avoid SSR mismatches
      partialize: ({ token, user, expiresAt }) => ({ token, user, expiresAt }),
      onRehydrateStorage: () => () => useAuthStore.setState({ hydrated: true }),
    },
  ),
);

/** The token if present and not expired (read outside React, e.g. in Axios). */
export function getValidToken(): string | null {
  const { token, expiresAt } = useAuthStore.getState();
  return token && expiresAt && expiresAt > Date.now() ? token : null;
}

export function useSession() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const hydrated = useAuthStore((s) => s.hydrated);
  // eslint-disable-next-line react-hooks/purity -- expiry is re-checked on each render by design
  const valid = !!token && !!expiresAt && expiresAt > Date.now();
  return { user: valid ? user : null, token: valid ? token : null, hydrated };
}
