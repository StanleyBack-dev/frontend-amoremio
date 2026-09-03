import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const SalesOrderStatusSchema = z.enum([
  "ABERTA",
  "CONFIRMADA",
  "CANCELADA",
]);

export const SalesChannelSchema = z.enum([
  "BALCAO",
  "IFOOD",
  "RAPPI",
  "FOOD_99",
  "UBER_EATS",
  "AIQFOME",
  "WHATSAPP",
  "TELEFONE",
  "OUTRO",
]);

export const SalesDiscountModeSchema = z.enum(["VALOR", "PERCENTUAL"]);

export const ProductKindSchema = z.enum([
  "INSUMO",
  "INTERMEDIARIO",
  "PRODUTO_FINAL",
  "REVENDA",
]);

export const SalesOrderItemSchema = z.object({
  idSalesOrderItem: z.string(),
  idProduct: z.string(),
  productName: z.string(),
  productKind: ProductKindSchema,
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
});

export const SalesOrderSchema = z.object({
  idSalesOrder: z.string(),
  idStore: z.string(),
  customerName: z.string().nullable().optional(),
  orderDate: z.string(),
  status: SalesOrderStatusSchema,
  salesChannel: SalesChannelSchema,
  commissionPercent: z.number(),
  commissionAmount: z.number(),
  netTotal: z.number(),
  discountAmount: z.number(),
  discountMode: SalesDiscountModeSchema.default("VALOR"),
  discountPercent: z.number().default(0),
  itemsSubtotal: z.number(),
  total: z.number(),
  notes: z.string().nullable().optional(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  confirmedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: SalesOrderItemSchema.array(),
});

export type SalesOrderStatus = z.infer<typeof SalesOrderStatusSchema>;
export type SalesChannel = z.infer<typeof SalesChannelSchema>;
export type SalesDiscountMode = z.infer<typeof SalesDiscountModeSchema>;
export type SalesOrderItem = z.infer<typeof SalesOrderItemSchema>;
export type SalesOrder = z.infer<typeof SalesOrderSchema>;
export type SalesOrdersResponse = PaginatedResponse<SalesOrder>;

export const SalesOrderFilterOptionsSchema = z.object({
  customers: z.array(z.string()).default([]),
  channels: z.array(SalesChannelSchema).default([]),
  creators: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .default([]),
});
export type SalesOrderFilterOptions = z.infer<
  typeof SalesOrderFilterOptionsSchema
>;

export interface ListSalesOrdersParams {
  idStore: string;
  status?: SalesOrderStatus;
  customerName?: string;
  salesChannel?: SalesChannel;
  createdByUserId?: string;
  page?: number;
  limit?: number;
}

export interface CreateSalesOrderPayload {
  idStore: string;
  customerName?: string;
  orderDate?: string;
  salesChannel?: SalesChannel;
  notes?: string;
}

export interface UpdateSalesOrderHeaderPayload {
  idStore: string;
  idSalesOrder: string;
  customerName?: string;
  salesChannel?: SalesChannel;
  commissionPercent?: number;
  discountAmount?: number;
  discountMode?: SalesDiscountMode;
  discountPercent?: number;
  notes?: string;
}

export interface AddSalesOrderItemPayload {
  idStore: string;
  idSalesOrder: string;
  idProduct: string;
  quantity: number;
  unitPrice?: number;
}
