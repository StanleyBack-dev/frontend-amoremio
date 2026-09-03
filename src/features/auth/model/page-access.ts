import type { ActiveView } from "../../../types/views";
import type { PageAccessKey, UserGroup } from "../../../api/users/schema";
import { getDefaultPagePermissionsByGroup } from "../../users/model/group-defaults";

const pageAccessByView: Partial<Record<ActiveView, PageAccessKey>> = {
  dashboard: "DASHBOARD",
  users: "ADMIN",
};

export function getGroupDefaultPagePermissions(
  group: UserGroup,
): PageAccessKey[] {
  return getDefaultPagePermissionsByGroup(group);
}

export function hasPageAccess(
  view: ActiveView,
  pagePermissions: PageAccessKey[],
): boolean {
  if (
    view === "profile" ||
    view === "settings" ||
    view === "termsOfUse" ||
    view === "stores" ||
    view === "products" ||
    view === "brands" ||
    view === "suppliers" ||
    view === "recipes" ||
    view === "inventory" ||
    view === "purchases" ||
    view === "production" ||
    view === "sales" ||
    view === "dashboard"
  ) {
    // Access to these is decided per-store by the backend (store role); the
    // client shows the nav entry and lets the API reject if needed.
    return true;
  }

  const requiredPermission = pageAccessByView[view];
  if (!requiredPermission) {
    return true;
  }

  return pagePermissions.includes(requiredPermission);
}

export function isRoutedView(view: ActiveView): boolean {
  return view !== "profile";
}
