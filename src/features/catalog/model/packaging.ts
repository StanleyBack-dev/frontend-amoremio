import type { PackagingUnit } from "@/api/catalog/schema";

// Singular label — how one physical item is called ("1 saco", "1 caixa").
export const packagingUnitLabel: Record<PackagingUnit, string> = {
  UNIDADE: "Unidade",
  PACOTE: "Pacote",
  CAIXA: "Caixa",
  FARDO: "Fardo",
  SACO: "Saco",
  GARRAFA: "Garrafa",
  LATA: "Lata",
  POTE: "Pote",
  DUZIA: "Dúzia",
  BANDEJA: "Bandeja",
};

// Plural label — for counts ("10 sacos", "2 caixas").
export const packagingUnitLabelPlural: Record<PackagingUnit, string> = {
  UNIDADE: "unidades",
  PACOTE: "pacotes",
  CAIXA: "caixas",
  FARDO: "fardos",
  SACO: "sacos",
  GARRAFA: "garrafas",
  LATA: "latas",
  POTE: "potes",
  DUZIA: "dúzias",
  BANDEJA: "bandejas",
};

export const packagingUnitOptions: { value: PackagingUnit; label: string }[] = (
  Object.keys(packagingUnitLabel) as PackagingUnit[]
).map((value) => ({ value, label: packagingUnitLabel[value] }));

export function packagingCountLabel(
  count: number,
  packagingUnit: PackagingUnit,
): string {
  return `${count} ${
    count === 1
      ? packagingUnitLabel[packagingUnit].toLowerCase()
      : packagingUnitLabelPlural[packagingUnit]
  }`;
}
