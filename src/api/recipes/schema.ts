import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const RecipeItemSchema = z.object({
  idRecipeItem: z.string(),
  idProduct: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unit: z.string(),
});

export const RecipeSchema = z.object({
  idRecipe: z.string(),
  idStore: z.string(),
  idOutputProduct: z.string(),
  outputProductName: z.string(),
  name: z.string(),
  yieldQuantity: z.number(),
  yieldUnit: z.string(),
  laborCost: z.number(),
  overheadCost: z.number(),
  status: z.boolean(),
  notes: z.string().nullable().optional(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: RecipeItemSchema.array(),
});

export type RecipeItem = z.infer<typeof RecipeItemSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipesResponse = PaginatedResponse<Recipe>;

export interface ListRecipesParams {
  idStore: string;
  page?: number;
  limit?: number;
  status?: boolean;
}

export interface CreateRecipePayload {
  idStore: string;
  idOutputProduct: string;
  name?: string;
  yieldQuantity: number;
  laborCost?: number;
  overheadCost?: number;
  notes?: string;
}

export interface UpdateRecipePayload {
  idStore: string;
  idRecipe: string;
  name?: string;
  yieldQuantity?: number;
  laborCost?: number;
  overheadCost?: number;
  status?: boolean;
  notes?: string;
}

export interface AddRecipeItemPayload {
  idStore: string;
  idRecipe: string;
  idProduct: string;
  quantity: number;
}

export interface AddRecipeItemsPayload {
  idStore: string;
  idRecipe: string;
  items: Array<{ idProduct: string; quantity: number }>;
}
