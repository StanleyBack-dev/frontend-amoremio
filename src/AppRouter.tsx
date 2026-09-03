import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  RequireAuthorizationRoute,
  requireActiveUserPolicy,
} from "./features/auth";
import RequireAuthenticatedRoute from "./features/auth/guards/RequireAuthenticatedRoute";
import { useAuthSession } from "./features/auth/context/useAuthSession";
import { AppShellRoutes } from "./router/routes/AppShellRoutes";
import { AuthRoutes } from "./router/routes/AuthRoutes";
import { routePaths } from "./router/navigation";

export default function AppRouter() {
  const { session } = useAuthSession();
  const authenticatedUserId = session?.user.idUsers;

  return (
    <BrowserRouter>
      <Routes>
        {AuthRoutes()}

        <Route element={<RequireAuthenticatedRoute />}>
          {/* Private app: the root goes straight to the dashboard (or to
              /login via RequireAuthenticatedRoute when there's no session). */}
          <Route
            path="/"
            element={<Navigate to={routePaths.dashboard} replace />}
          />
          <Route
            element={
              <RequireAuthorizationRoute
                policy={requireActiveUserPolicy}
                deniedState={{ reasonCode: "USER_INACTIVE" }}
              />
            }
          >
            {AppShellRoutes({ userId: authenticatedUserId })}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
