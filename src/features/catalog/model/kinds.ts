import type { BadgeTone } from "@/components/atoms/Badge";
import type { ProductKind } from "@/api/catalog/schema";

// One distinct badge colour per product kind.
export const kindTone: Record<ProductKind, BadgeTone> = {
  INSUMO: "info",
  INTERMEDIARIO: "warning",
  PRODUTO_FINAL: "gold",
  REVENDA: "success",
};

export const kindLabel: Record<ProductKind, string> = {
  INSUMO: "Insumo (produção)",
  INTERMEDIARIO: "Intermediário (sub-receita)",
  PRODUTO_FINAL: "Produto final (venda)",
  REVENDA: "Revenda (compra e venda)",
};

export const kindShortLabel: Record<ProductKind, string> = {
  INSUMO: "Insumo",
  INTERMEDIARIO: "Intermediário",
  PRODUTO_FINAL: "Produto final",
  REVENDA: "Revenda",
};

export const kindOptions: { value: ProductKind; label: string }[] = (
  Object.keys(kindLabel) as ProductKind[]
).map((value) => ({ value, label: kindLabel[value] }));

// Kinds shown when picking a product for a purchase / a sale.
export const PURCHASABLE_KINDS: ProductKind[] = ["INSUMO", "REVENDA"];
export const SELLABLE_KINDS: ProductKind[] = ["PRODUTO_FINAL", "REVENDA"];

// Kinds a recipe can produce / consume (mirrors the backend).
export const RECIPE_OUTPUT_KINDS: ProductKind[] = [
  "PRODUTO_FINAL",
  "INTERMEDIARIO",
];
export const RECIPE_INPUT_KINDS: ProductKind[] = ["INSUMO", "INTERMEDIARIO"];
