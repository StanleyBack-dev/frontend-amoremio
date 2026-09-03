import type { ActiveView } from "../../types/views";

export const routePaths: Record<ActiveView, string> = {
  dashboard: "/dashboard",
  products: "/produtos",
  brands: "/marcas",
  suppliers: "/fornecedores",
  recipes: "/receitas",
  inventory: "/estoque",
  purchases: "/compras",
  production: "/producao",
  sales: "/vendas",
  users: "/usuarios",
  stores: "/lojas",
  profile: "/perfil",
  settings: "/configuracoes",
  termsOfUse: "/termos-e-privacidade",
};

export const productRoutePaths = {
  list: "/produtos",
};

export const brandRoutePaths = {
  list: "/marcas",
};

export const supplierRoutePaths = {
  list: "/fornecedores",
};

export const recipeRoutePaths = {
  list: "/receitas",
};

export const productionRoutePaths = {
  list: "/producao",
};

export const inventoryRoutePaths = {
  list: "/estoque",
};

export const purchaseRoutePaths = {
  list: "/compras",
};

export const salesRoutePaths = {
  list: "/vendas",
};

export const dashboardRoutePaths = {
  list: "/dashboard",
};

export const userRoutePaths = {
  list: "/usuarios",
  create: "/usuarios/new",
  edit: (id = ":id") => `/usuarios/${id}/edit`,
  legacyList: "/users",
  legacyCreate: "/users/new",
  legacyEdit: (id = ":id") => `/users/${id}/edit`,
};

export const authRoutePaths = {
  root: "/",
  login: "/login",
  firstAccessChangePassword: "/primeiro-acesso/alterar-senha",
  passwordRecovery: "/recuperar-senha",
  passwordRecoveryReset: "/recuperar-senha/nova-senha",
};

export const storeRoutePaths = {
  list: "/lojas",
};

export const profileRoutePaths = {
  list: "/perfil",
};

export const settingsRoutePaths = {
  list: "/configuracoes",
};

export const termsOfUseRoutePaths = {
  list: "/termos-e-privacidade",
};

export const utilityRoutePaths = {
  accessDenied: "/acesso-negado",
};
