import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const ShoppingListStatusSchema = z.enum([
  "ABERTA",
  "CONVERTIDA",
  "CANCELADA",
]);

export const ShoppingListItemSchema = z.object({
  idShoppingListItem: z.string(),
  idProduct: z.string(),
  productName: z.string(),
  unit: z.string(),
  desiredQuantity: z.number(),
  note: z.string().nullable().optional(),
  purchased: z.boolean(),
});

export const ShoppingListSchema = z.object({
  idShoppingList: z.string(),
  idStore: z.string(),
  name: z.string().nullable().optional(),
  status: ShoppingListStatusSchema,
  notes: z.string().nullable().optional(),
  convertedToPurchaseId: z.string().nullable().optional(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  convertedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: ShoppingListItemSchema.array(),
});

export type ShoppingListStatus = z.infer<typeof ShoppingListStatusSchema>;
export type ShoppingListItem = z.infer<typeof ShoppingListItemSchema>;
export type ShoppingList = z.infer<typeof ShoppingListSchema>;
export type ShoppingListsResponse = PaginatedResponse<ShoppingList>;

export interface ListShoppingListsParams {
  idStore: string;
  status?: ShoppingListStatus;
  createdByUserId?: string;
  page?: number;
  limit?: number;
}

export interface CreateShoppingListPayload {
  idStore: string;
  name?: string;
  notes?: string;
}

export interface AddShoppingListItemPayload {
  idStore: string;
  idShoppingList: string;
  idProduct: string;
  desiredQuantity: number;
  note?: string;
}

export interface AddShoppingListItemsPayload {
  idStore: string;
  idShoppingList: string;
  items: Array<{
    idProduct: string;
    desiredQuantity: number;
    note?: string;
  }>;
}

export interface UpdateShoppingListItemPayload {
  idStore: string;
  idShoppingList: string;
  idShoppingListItem: string;
  desiredQuantity?: number;
  note?: string;
  purchased?: boolean;
}
