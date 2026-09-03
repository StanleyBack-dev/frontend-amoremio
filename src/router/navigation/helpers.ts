import type { ActiveView } from "../../types/views";
import {
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
  userRoutePaths,
} from "./paths";

export function getActiveView(pathname: string): ActiveView {
  if (pathname.startsWith(brandRoutePaths.list)) {
    return "brands";
  }

  if (pathname.startsWith(supplierRoutePaths.list)) {
    return "suppliers";
  }

  if (pathname.startsWith(productRoutePaths.list)) {
    return "products";
  }

  if (pathname.startsWith(recipeRoutePaths.list)) {
    return "recipes";
  }

  if (pathname.startsWith(inventoryRoutePaths.list)) {
    return "inventory";
  }

  if (pathname.startsWith(purchaseRoutePaths.list)) {
    return "purchases";
  }

  if (pathname.startsWith(productionRoutePaths.list)) {
    return "production";
  }

  if (pathname.startsWith(salesRoutePaths.list)) {
    return "sales";
  }

  if (
    pathname.startsWith(userRoutePaths.list) ||
    pathname.startsWith(userRoutePaths.legacyList)
  ) {
    return "users";
  }

  if (pathname.startsWith(storeRoutePaths.list)) {
    return "stores";
  }

  if (pathname.startsWith(profileRoutePaths.list)) {
    return "profile";
  }

  if (pathname.startsWith(settingsRoutePaths.list)) {
    return "settings";
  }

  if (pathname.startsWith(termsOfUseRoutePaths.list)) {
    return "termsOfUse";
  }

  return "dashboard";
}

export function getPathForView(view: ActiveView): string {
  switch (view) {
    case "products":
      return productRoutePaths.list;
    case "brands":
      return brandRoutePaths.list;
    case "suppliers":
      return supplierRoutePaths.list;
    case "recipes":
      return recipeRoutePaths.list;
    case "inventory":
      return inventoryRoutePaths.list;
    case "purchases":
      return purchaseRoutePaths.list;
    case "production":
      return productionRoutePaths.list;
    case "sales":
      return salesRoutePaths.list;
    case "users":
      return userRoutePaths.list;
    case "stores":
      return storeRoutePaths.list;
    case "profile":
      return profileRoutePaths.list;
    case "settings":
      return settingsRoutePaths.list;
    case "termsOfUse":
      return termsOfUseRoutePaths.list;
    case "dashboard":
    default:
      return dashboardRoutePaths.list;
  }
}
