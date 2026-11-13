import Alert from "react-bootstrap/Alert";
import { Navigate, Outlet, useLocation } from "react-router";

import { useSession } from "@/store/authStore";

/** RBAC route guard: only users with the `admin` role. (The API enforces this too.) */
export function AdminRoute() {
  const { user, isAdmin } = useSession();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) return <Alert variant="warning">This page is for administrators only.</Alert>;
  return <Outlet />;
}
