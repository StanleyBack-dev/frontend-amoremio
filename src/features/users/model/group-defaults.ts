import type { PageAccessKey, UserGroup } from "../../../api/users/schema";

export const defaultByGroup: Record<UserGroup, PageAccessKey[]> = {
  USER: [
    "DASHBOARD",
    "DEBTS",
    "DEBTS_STATEMENT",
    "INCOMES",
    "PAYMENTS",
    "INCOME_RECEIPTS",
    "CREDIT_CARDS",
  ],
  ADMIN: [
    "DASHBOARD",
    "DEBTS",
    "DEBTS_STATEMENT",
    "INCOMES",
    "PAYMENTS",
    "INCOME_RECEIPTS",
    "CREDIT_CARDS",
  ],
  ADMIN_MASTER: [
    "DASHBOARD",
    "DEBTS",
    "DEBTS_STATEMENT",
    "INCOMES",
    "PAYMENTS",
    "INCOME_RECEIPTS",
    "CREDIT_CARDS",
    "ADMIN",
  ],
};

export function getDefaultPagePermissionsByGroup(
  group: UserGroup,
): PageAccessKey[] {
  return defaultByGroup[group] ?? [];
}
