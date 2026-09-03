import {
  adjustStock as adjustStockRequest,
  getStockMovements as getStockMovementsRequest,
  getStoreStock as getStoreStockRequest,
} from "@/api/inventory/methods";
import {
  AdjustStockPayloadSchema,
  StockItemsResponseSchema,
  StockMovementsResponseSchema,
  type AdjustStockPayload,
  type ListStockMovementsParams,
  type ListStoreStockParams,
  type StockItem,
  type StockMovement,
  type StockMovementType,
} from "@/api/inventory/schema";

const INVALID = "Resposta inválida do servidor de estoque.";

export interface PageMeta {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface StockResult {
  items: StockItem[];
  pagination: PageMeta;
  stockValueTotal: number;
}

export interface MovementsResult {
  items: StockMovement[];
  pagination: PageMeta;
}

export async function fetchStoreStock(
  params: ListStoreStockParams,
): Promise<StockResult> {
  const parsed = StockItemsResponseSchema.safeParse(
    await getStoreStockRequest(params),
  );
  if (!parsed.success) throw new Error(INVALID);
  const { items, stockValueTotal, ...pagination } = parsed.data;
  return { items, pagination, stockValueTotal };
}

export async function fetchStockMovements(
  params: ListStockMovementsParams,
): Promise<MovementsResult> {
  const parsed = StockMovementsResponseSchema.safeParse(
    await getStockMovementsRequest(params),
  );
  if (!parsed.success) throw new Error(INVALID);
  const { items, ...pagination } = parsed.data;
  return { items, pagination };
}

export async function adjustStock(payload: AdjustStockPayload): Promise<void> {
  await adjustStockRequest(AdjustStockPayloadSchema.parse(payload));
}

export const movementTypeLabel: Record<StockMovementType, string> = {
  ENTRADA_COMPRA: "Entrada (compra)",
  SAIDA_VENDA: "Saída (venda)",
  SAIDA_PRODUCAO: "Saída (produção)",
  ENTRADA_PRODUCAO: "Entrada (produção)",
  AJUSTE_POSITIVO: "Ajuste +",
  AJUSTE_NEGATIVO: "Ajuste −",
  PERDA: "Perda",
};

// One distinct badge colour per movement type instead of grouping them all
// into "entrada = verde / saída = vermelho".
export const movementTypeTone: Record<
  StockMovementType,
  "neutral" | "brand" | "gold" | "success" | "danger" | "warning" | "info"
> = {
  ENTRADA_COMPRA: "success",
  ENTRADA_PRODUCAO: "info",
  SAIDA_VENDA: "brand",
  SAIDA_PRODUCAO: "gold",
  AJUSTE_POSITIVO: "warning",
  AJUSTE_NEGATIVO: "neutral",
  PERDA: "danger",
};

export const movementTypeOptions: {
  value: StockMovementType;
  label: string;
}[] = (Object.keys(movementTypeLabel) as StockMovementType[]).map((value) => ({
  value,
  label: movementTypeLabel[value],
}));

export const adjustmentTypeOptions: {
  value: "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO" | "PERDA";
  label: string;
}[] = [
  { value: "AJUSTE_POSITIVO", label: "Entrada / correção para cima" },
  { value: "AJUSTE_NEGATIVO", label: "Correção para baixo" },
  { value: "PERDA", label: "Perda (quebra, vencimento, roubo)" },
];
