import { Navigate, Outlet, useLocation } from "react-router";

import { useSession } from "@/store/authStore";

/** Route guard: signed-in users only; others go to /login and come back after. */
export function ProtectedRoute() {
  const { user } = useSession();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return <Outlet />;
}
