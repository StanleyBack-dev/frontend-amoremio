import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import RequireAuthenticatedRoute from "../../features/auth/guards/RequireAuthenticatedRoute";
import RequirePasswordChangeRoute from "../../features/auth/guards/RequirePasswordChangeRoute";
import { authRoutePaths } from "../navigation";

const Login = lazy(() => import("../../pages/Login"));
const ForgotPassword = lazy(() => import("../../pages/ForgotPassword"));
const FirstAccessChangePassword = lazy(
  () => import("../../pages/FirstAccessChangePassword"),
);
const ResetRecoveredPassword = lazy(
  () => import("../../pages/ResetRecoveredPassword"),
);

function withPageSuspense(element: React.ReactNode) {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Carregando...</div>}>
      {element}
    </Suspense>
  );
}

export function AuthRoutes() {
  return (
    <>
      <Route
        path={authRoutePaths.login}
        element={withPageSuspense(<Login />)}
      />
      <Route
        path={authRoutePaths.passwordRecovery}
        element={withPageSuspense(<ForgotPassword />)}
      />
      <Route
        path={authRoutePaths.passwordRecoveryReset}
        element={withPageSuspense(<ResetRecoveredPassword />)}
      />

      <Route element={<RequireAuthenticatedRoute />}>
        <Route element={<RequirePasswordChangeRoute />}>
          <Route
            path={authRoutePaths.firstAccessChangePassword}
            element={withPageSuspense(<FirstAccessChangePassword />)}
          />
        </Route>
      </Route>
    </>
  );
}
