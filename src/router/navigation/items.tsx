import type { ReactNode } from "react";
import type { ActiveView } from "../../types/views";
import {
  BookmarkCheck,
  Boxes,
  ChefHat,
  CookingPot,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  User,
  Users,
} from "lucide-react";

export interface NavigationItem {
  id: ActiveView;
  label: string;
  icon: ReactNode;
  proOnly?: boolean;
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon: ReactNode;
  items: NavigationItem[];
}

export type PrimaryNavigationEntry = NavigationItem | NavigationGroup;

export function isNavigationGroup(
  entry: PrimaryNavigationEntry,
): entry is NavigationGroup {
  return "items" in entry;
}

export const primaryNavigationLayout: PrimaryNavigationEntry[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "stores", label: "Lojas", icon: <Store size={20} /> },
  { id: "products", label: "Produtos", icon: <Package size={20} /> },
  { id: "brands", label: "Marcas", icon: <BookmarkCheck size={20} /> },
  { id: "suppliers", label: "Fornecedores", icon: <Truck size={20} /> },
  { id: "recipes", label: "Receitas", icon: <ChefHat size={20} /> },
  { id: "inventory", label: "Estoque", icon: <Boxes size={20} /> },
  { id: "purchases", label: "Compras", icon: <ShoppingCart size={20} /> },
  { id: "production", label: "Produção", icon: <CookingPot size={20} /> },
  { id: "sales", label: "Vendas", icon: <Receipt size={20} /> },
];

export const primaryNavigationItems: NavigationItem[] =
  primaryNavigationLayout.flatMap((entry) =>
    isNavigationGroup(entry) ? entry.items : [entry],
  );

// Rendered inside the collapsible "Conta" section at the bottom of the sidebar.
export const accountNavigationItems: NavigationItem[] = [
  { id: "users", label: "Usuários", icon: <Users size={20} /> },
  { id: "profile", label: "Perfil", icon: <User size={20} /> },
  { id: "settings", label: "Configurações", icon: <Settings size={20} /> },
];

// Kept for the Header page-title lookup — everything not in the primary nav.
export const secondaryNavigationItems: NavigationItem[] =
  accountNavigationItems;

export const settingsPageItems: NavigationItem[] = [
  {
    id: "termsOfUse",
    label: "Termos e Privacidade",
    icon: <ScrollText size={20} />,
  },
];
