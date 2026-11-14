import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api, getToken, setToken } from "@/lib/api.js";
import { keys } from "@/lib/queries.js";

import { AuthContext } from "./auth.js";

// JWTs are issued by FastAPI (/api/auth) and also accepted by the Express farm-service.
export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [token, setTokenState] = useState(getToken);

  useEffect(() => {
    const sync = () => setTokenState(getToken());
    window.addEventListener("auth:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const me = useQuery({
    queryKey: [...keys.me, token],
    queryFn: ({ signal }) => api.get("/api/auth/me", { signal, retries: 1 }),
    enabled: Boolean(token),
    staleTime: 300_000,
    retry: false,
  });

  const signIn = useCallback(
    async (email, password) => {
      const form = new URLSearchParams({ username: email, password });
      const res = await api.post("/api/auth/token", undefined, { form, auth: false, retries: 0 });
      setToken(res.access_token);
      qc.setQueryData([...keys.me, res.access_token], res.user);
    },
    [qc],
  );

  const register = useCallback(
    async ({ email, password, fullName }) => {
      const res = await api.post(
        "/api/auth/register",
        { email, password, full_name: fullName },
        { auth: false, retries: 0 },
      );
      setToken(res.access_token);
      qc.setQueryData([...keys.me, res.access_token], res.user);
    },
    [qc],
  );

  const signOut = useCallback(() => {
    setToken(null);
    qc.removeQueries({ queryKey: keys.farms });
  }, [qc]);

  const value = useMemo(
    () => ({
      user: token ? (me.data ?? null) : null,
      loading: Boolean(token) && me.isLoading,
      signIn,
      register,
      signOut,
    }),
    [token, me.data, me.isLoading, signIn, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
