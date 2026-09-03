import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const ProductionOrderStatusSchema = z.enum([
  "RASCUNHO",
  "CONCLUIDA",
  "CANCELADA",
]);

export const ProductionOrderItemSchema = z.object({
  idProductionOrderItem: z.string(),
  idProduct: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unit: z.string(),
  unitCostAtConsumption: z.number(),
  lineCost: z.number(),
});

export const ProductionOrderSchema = z.object({
  idProductionOrder: z.string(),
  idStore: z.string(),
  idRecipe: z.string(),
  recipeName: z.string(),
  idOutputProduct: z.string(),
  outputProductName: z.string(),
  productionDate: z.string(),
  status: ProductionOrderStatusSchema,
  batches: z.number(),
  plannedOutputQuantity: z.number(),
  actualOutputQuantity: z.number(),
  laborCost: z.number(),
  overheadCost: z.number(),
  inputsCost: z.number(),
  totalCost: z.number(),
  outputUnitCost: z.number(),
  notes: z.string().nullable().optional(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  concludedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: ProductionOrderItemSchema.array(),
});

export type ProductionOrderStatus = z.infer<typeof ProductionOrderStatusSchema>;
export type ProductionOrderItem = z.infer<typeof ProductionOrderItemSchema>;
export type ProductionOrder = z.infer<typeof ProductionOrderSchema>;
export type ProductionOrdersResponse = PaginatedResponse<ProductionOrder>;

export interface ListProductionOrdersParams {
  idStore: string;
  status?: ProductionOrderStatus;
  idRecipe?: string;
  createdByUserId?: string;
  page?: number;
  limit?: number;
}

export const ProductionOrderUserOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const ProductionOrderFilterOptionsSchema = z.object({
  recipes: z.array(ProductionOrderUserOptionSchema),
  creators: z.array(ProductionOrderUserOptionSchema),
});

export type ProductionOrderUserOption = z.infer<
  typeof ProductionOrderUserOptionSchema
>;
export type ProductionOrderFilterOptions = z.infer<
  typeof ProductionOrderFilterOptionsSchema
>;

export interface CreateProductionOrderPayload {
  idStore: string;
  idRecipe: string;
  productionDate?: string;
  batches: number;
  notes?: string;
}

export interface UpdateProductionOrderPayload {
  idStore: string;
  idProductionOrder: string;
  productionDate?: string;
  batches?: number;
  actualOutputQuantity?: number;
  laborCost?: number;
  overheadCost?: number;
  notes?: string;
}
