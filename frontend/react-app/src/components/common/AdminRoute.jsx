import { Navigate, Outlet, useLocation } from "react-router";

import { useSession } from "@/store/authStore";

/** RBAC route guard: only users with the `admin` role. (The API enforces this too.) */
export function AdminRoute() {
  const { user, isAdmin } = useSession();
  const location = useLocation();
  if (!user)
    return (
      <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`} replace />
    );
  if (!isAdmin)
    return (
      <div className="alert alert-warning m-4" role="alert">
        This page is for administrators only.
      </div>
    );
  return <Outlet />;
}
