import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { Navigate, Route } from "react-router-dom";
import { UsersProviderOutlet } from "../../features/users";
import RequirePageAccessRoute from "../../features/auth/guards/RequirePageAccessRoute";
import { userRoutePaths } from "../navigation";

const Users = lazy(() => import("../../pages/users/Users"));
const UserForm = lazy(() => import("../../pages/users/UserForm"));

function withPageSuspense(element: React.ReactNode) {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Carregando...</div>}>
      {element}
    </Suspense>
  );
}

interface UserScopedProviderRouteProps {
  userId?: string;
  loginPath: string;
  ProviderOutlet: ComponentType<{ userId?: string }>;
}

function UserScopedProviderRoute({
  userId,
  loginPath,
  ProviderOutlet,
}: UserScopedProviderRouteProps) {
  if (!userId) {
    return <Navigate to={loginPath} replace />;
  }

  return <ProviderOutlet userId={userId} />;
}

interface ManagementRoutesProps {
  userId?: string;
  loginPath: string;
}

export function ManagementRoutes({ userId, loginPath }: ManagementRoutesProps) {
  return (
    <>
      <Route element={<RequirePageAccessRoute view="users" />}>
        <Route
          element={
            <UserScopedProviderRoute
              userId={userId}
              loginPath={loginPath}
              ProviderOutlet={UsersProviderOutlet}
            />
          }
        >
          <Route
            path={userRoutePaths.list}
            element={withPageSuspense(<Users />)}
          />
          <Route
            path={userRoutePaths.create}
            element={withPageSuspense(<UserForm mode="create" />)}
          />
          <Route
            path={userRoutePaths.edit()}
            element={withPageSuspense(<UserForm mode="edit" />)}
          />
        </Route>
      </Route>

      <Route
        path={userRoutePaths.legacyList}
        element={<Navigate to={userRoutePaths.list} replace />}
      />
    </>
  );
}
