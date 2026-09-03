import type { UnitOfMeasure } from "@/api/catalog/schema";

export const unitLabel: Record<UnitOfMeasure, string> = {
  UN: "Unidade",
  KG: "Quilograma (kg)",
  G: "Grama (g)",
  L: "Litro (L)",
  ML: "Mililitro (ml)",
  CX: "Caixa",
  FARDO: "Fardo",
  PACOTE: "Pacote",
  DUZIA: "Dúzia",
};

export const unitOptions: { value: UnitOfMeasure; label: string }[] = (
  Object.keys(unitLabel) as UnitOfMeasure[]
).map((value) => ({ value, label: unitLabel[value] }));
