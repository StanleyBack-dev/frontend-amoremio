import type { StoreRole } from "@/api/stores/schema";

export const storeRoleLabel: Record<StoreRole, string> = {
  DONO: "Dono",
  GERENTE: "Gerente",
  FUNCIONARIO: "Funcionário",
};

export const storeRoleOptions: { value: StoreRole; label: string }[] = [
  { value: "FUNCIONARIO", label: storeRoleLabel.FUNCIONARIO },
  { value: "GERENTE", label: storeRoleLabel.GERENTE },
  { value: "DONO", label: storeRoleLabel.DONO },
];
