import { z } from "zod";
import { ProductKindSchema, UnitOfMeasureSchema } from "../catalog/schema";

export const StockMovementTypeSchema = z.enum([
  "ENTRADA_COMPRA",
  "SAIDA_VENDA",
  "SAIDA_PRODUCAO",
  "ENTRADA_PRODUCAO",
  "AJUSTE_POSITIVO",
  "AJUSTE_NEGATIVO",
  "PERDA",
]);

export const StockItemSchema = z.object({
  idProduct: z.string(),
  idStore: z.string(),
  productName: z.string(),
  sku: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  kind: ProductKindSchema,
  status: z.boolean(),
  unit: UnitOfMeasureSchema,
  quantityOnHand: z.number(),
  averageCost: z.number(),
  stockValue: z.number(),
  reorderPoint: z.number().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const StockMovementSchema = z.object({
  idStockMovement: z.string(),
  idStore: z.string(),
  idProduct: z.string(),
  productName: z.string(),
  unit: UnitOfMeasureSchema.default("UN"),
  type: StockMovementTypeSchema,
  quantity: z.number(),
  unitCost: z.number(),
  resultingQuantity: z.number(),
  resultingAverageCost: z.number(),
  sourceType: z.string().nullable().optional(),
  sourceId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  occurredAt: z.string(),
});

export const AdjustStockPayloadSchema = z.object({
  idStore: z.string().min(1),
  idProduct: z.string().min(1),
  type: z.enum(["AJUSTE_POSITIVO", "AJUSTE_NEGATIVO", "PERDA"]),
  quantity: z.number().positive(),
  unitCost: z.number().min(0).optional(),
  note: z.string().optional(),
});

export type StockMovementType = z.infer<typeof StockMovementTypeSchema>;
export type StockItem = z.infer<typeof StockItemSchema>;
export type StockMovement = z.infer<typeof StockMovementSchema>;
export type AdjustStockPayload = z.infer<typeof AdjustStockPayloadSchema>;

export interface ListStoreStockParams {
  idStore: string;
  name?: string;
  brand?: string;
  withoutBrand?: boolean;
  kind?: string;
  unit?: string;
  status?: boolean;
  page?: number;
  limit?: number;
}

export interface ListStockMovementsParams {
  idStore: string;
  idProduct?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const StockPaginationSchema = z.object({
  total: z.number(),
  currentPage: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
});

export const StockItemsResponseSchema = z.object({
  items: StockItemSchema.array(),
  total: z.number(),
  currentPage: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  stockValueTotal: z.number().default(0),
});

export const StockMovementsResponseSchema = z.object({
  items: StockMovementSchema.array(),
  total: z.number(),
  currentPage: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
});
