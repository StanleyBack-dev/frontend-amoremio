import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const PurchaseStatusSchema = z.enum([
  "RASCUNHO",
  "FINALIZADA",
  "CANCELADA",
]);

export const PurchaseDiscountModeSchema = z.enum(["VALOR", "PERCENTUAL"]);
export type PurchaseDiscountMode = z.infer<typeof PurchaseDiscountModeSchema>;

export const PurchaseItemSchema = z.object({
  idPurchaseItem: z.string(),
  idProduct: z.string(),
  productName: z.string(),
  purchasedQuantity: z.number(),
  purchasedUnit: z.string(),
  conversionFactor: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  baseQuantity: z.number(),
  effectiveUnitCost: z.number(),
});

export const PurchaseSchema = z.object({
  idPurchase: z.string(),
  idStore: z.string(),
  supplierName: z.string().nullable().optional(),
  purchaseDate: z.string(),
  status: PurchaseStatusSchema,
  freightAmount: z.number(),
  discountAmount: z.number(),
  discountMode: PurchaseDiscountModeSchema.optional().default("VALOR"),
  discountPercent: z.number().optional().default(0),
  itemsSubtotal: z.number(),
  total: z.number(),
  notes: z.string().nullable().optional(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  finalizedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: PurchaseItemSchema.array(),
});

export interface ListPurchasesParams {
  idStore: string;
  status?: PurchaseStatus;
  supplierName?: string;
  createdByUserId?: string;
  page?: number;
  limit?: number;
}

export const PurchaseUserOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const PurchaseFilterOptionsSchema = z.object({
  suppliers: z.array(z.string()),
  creators: z.array(PurchaseUserOptionSchema),
});

export type PurchaseUserOption = z.infer<typeof PurchaseUserOptionSchema>;
export type PurchaseFilterOptions = z.infer<typeof PurchaseFilterOptionsSchema>;

export type PurchaseStatus = z.infer<typeof PurchaseStatusSchema>;
export type PurchaseItem = z.infer<typeof PurchaseItemSchema>;
export type Purchase = z.infer<typeof PurchaseSchema>;
export type PurchasesResponse = PaginatedResponse<Purchase>;

export interface CreatePurchaseDraftPayload {
  idStore: string;
  supplierName?: string;
  purchaseDate?: string;
  notes?: string;
}

export interface UpdatePurchaseHeaderPayload {
  idStore: string;
  idPurchase: string;
  supplierName?: string;
  purchaseDate?: string;
  freightAmount?: number;
  discountAmount?: number;
  discountMode?: PurchaseDiscountMode;
  discountPercent?: number;
  notes?: string;
}

export interface AddPurchaseItemPayload {
  idStore: string;
  idPurchase: string;
  idProduct: string;
  purchasedQuantity: number;
  purchasedUnit?: string;
  conversionFactor: number;
  unitPrice: number;
}
