import { lazy, Suspense } from "react";
import { Navigate, Route } from "react-router-dom";
import AppLayout from "../AppLayout";
import {
  authRoutePaths,
  brandRoutePaths,
  dashboardRoutePaths,
  inventoryRoutePaths,
  productRoutePaths,
  productionRoutePaths,
  purchaseRoutePaths,
  recipeRoutePaths,
  salesRoutePaths,
  profileRoutePaths,
  settingsRoutePaths,
  storeRoutePaths,
  supplierRoutePaths,
  termsOfUseRoutePaths,
} from "../navigation";
import RequirePageAccessRoute from "../../features/auth/guards/RequirePageAccessRoute";
import { ManagementRoutes } from "./ManagementRoutes";

const Dashboard = lazy(() => import("../../pages/Dashboard"));
const Products = lazy(() => import("../../pages/products/Products"));
const Brands = lazy(() => import("../../pages/brands/Brands"));
const Suppliers = lazy(() => import("../../pages/suppliers/Suppliers"));
const Recipes = lazy(() => import("../../pages/recipes/Recipes"));
const Inventory = lazy(() => import("../../pages/inventory/Inventory"));
const Purchases = lazy(() => import("../../pages/purchases/Purchases"));
const Production = lazy(() => import("../../pages/production/Production"));
const Sales = lazy(() => import("../../pages/sales/Sales"));
const Stores = lazy(() => import("../../pages/stores/Stores"));
const Profile = lazy(() => import("../../pages/Profile"));
const Settings = lazy(() => import("../../pages/Settings"));
const TermsOfUse = lazy(() => import("../../pages/TermsOfUse"));

function withPageSuspense(element: React.ReactNode) {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Carregando...</div>}>
      {element}
    </Suspense>
  );
}

interface AppShellRoutesProps {
  userId?: string;
}

export function AppShellRoutes({ userId }: AppShellRoutesProps) {
  return (
    <Route element={<AppLayout />}>
      {ManagementRoutes({ userId, loginPath: authRoutePaths.login })}

      <Route element={<RequirePageAccessRoute view="dashboard" />}>
        <Route
          path={dashboardRoutePaths.list}
          element={withPageSuspense(<Dashboard />)}
        />
      </Route>

      <Route
        path={productRoutePaths.list}
        element={withPageSuspense(<Products />)}
      />
      <Route
        path={brandRoutePaths.list}
        element={withPageSuspense(<Brands />)}
      />
      <Route
        path={supplierRoutePaths.list}
        element={withPageSuspense(<Suppliers />)}
      />
      <Route
        path={recipeRoutePaths.list}
        element={withPageSuspense(<Recipes />)}
      />
      <Route
        path={inventoryRoutePaths.list}
        element={withPageSuspense(<Inventory />)}
      />
      <Route
        path={purchaseRoutePaths.list}
        element={withPageSuspense(<Purchases />)}
      />
      <Route
        path={productionRoutePaths.list}
        element={withPageSuspense(<Production />)}
      />
      <Route
        path={salesRoutePaths.list}
        element={withPageSuspense(<Sales />)}
      />
      <Route
        path={storeRoutePaths.list}
        element={withPageSuspense(<Stores />)}
      />
      <Route
        path={profileRoutePaths.list}
        element={withPageSuspense(<Profile />)}
      />
      <Route
        path={settingsRoutePaths.list}
        element={withPageSuspense(<Settings />)}
      />
      <Route
        path={termsOfUseRoutePaths.list}
        element={withPageSuspense(<TermsOfUse />)}
      />

      <Route
        path="*"
        element={<Navigate to={dashboardRoutePaths.list} replace />}
      />
    </Route>
  );
}
