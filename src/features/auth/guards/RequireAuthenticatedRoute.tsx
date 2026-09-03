import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authRoutePaths } from "../../../router/navigation";
import { useAuthSession } from "../context/useAuthSession";
import SplashScreen from "../../../pages/SplashScreen";
import SystemUnstableScreen from "../../../pages/SystemUnstableScreen";
import {
  getSystemDown,
  subscribeSystemStatus,
} from "../../../shared/system-status/system-status-events";

export default function RequireAuthenticatedRoute() {
  const location = useLocation();
  const { isAuthenticated, requiresPasswordChange, isInitializing } =
    useAuthSession();
  const [systemDown, setSystemDownState] = useState(getSystemDown());

  useEffect(() => subscribeSystemStatus(setSystemDownState), []);

  // Session status is only known once the initial check resolves, and that
  // check needs the backend to be reachable — gating on both here (instead
  // of at the app root) keeps the public /login route rendering immediately,
  // without waiting on a network round trip it doesn't need.
  if (systemDown) {
    return <SystemUnstableScreen />;
  }

  if (isInitializing) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to={authRoutePaths.login} replace state={{ from: location }} />
    );
  }

  if (
    requiresPasswordChange &&
    location.pathname !== authRoutePaths.firstAccessChangePassword
  ) {
    return <Navigate to={authRoutePaths.firstAccessChangePassword} replace />;
  }

  return <Outlet />;
}
