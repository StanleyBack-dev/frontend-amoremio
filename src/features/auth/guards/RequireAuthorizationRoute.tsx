import { Navigate, Outlet, useLocation } from "react-router-dom";
import { utilityRoutePaths } from "../../../router";
import type { ActiveView } from "../../../types/views";
import type {
  AuthorizationPolicy,
  AuthorizationPolicyContext,
} from "../model/authorization-policy";
import type { AccessDeniedRouteState } from "../model/access-denied";
import { toAccessDeniedState } from "../model/access-denied";
import { useAuthSession } from "../context/useAuthSession";

interface RequireAuthorizationRouteProps {
  policy: AuthorizationPolicy;
  deniedView?: ActiveView;
  deniedState?: AccessDeniedRouteState;
  redirectPath?: string;
}

export default function RequireAuthorizationRoute({
  policy,
  deniedView,
  deniedState,
  redirectPath = utilityRoutePaths.accessDenied,
}: RequireAuthorizationRouteProps) {
  const location = useLocation();
  const auth = useAuthSession();

  if (auth.isInitializing) {
    return null;
  }

  const context: AuthorizationPolicyContext = {
    session: auth.session,
    isAuthenticated: auth.isAuthenticated,
    requiresPasswordChange: auth.requiresPasswordChange,
    isInitializing: auth.isInitializing,
    pagePermissions: auth.pagePermissions,
    hasPageAccess: auth.hasPageAccess,
  };

  if (!policy(context)) {
    const computedDeniedState = deniedView
      ? toAccessDeniedState(deniedView, location.pathname)
      : {
          deniedPathname: location.pathname,
        };

    return (
      <Navigate
        to={redirectPath}
        replace
        state={{ ...computedDeniedState, ...deniedState }}
      />
    );
  }

  return <Outlet />;
}
