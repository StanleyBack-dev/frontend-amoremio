import { Navigate, Outlet } from "react-router-dom";
import { authRoutePaths, routePaths } from "../../../router/navigation";
import { useAuthSession } from "../context/useAuthSession";

export default function RequirePasswordChangeRoute() {
  const { isAuthenticated, requiresPasswordChange, isInitializing } =
    useAuthSession();

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={authRoutePaths.login} replace />;
  }

  if (!requiresPasswordChange) {
    return <Navigate to={routePaths.dashboard} replace />;
  }

  return <Outlet />;
}
