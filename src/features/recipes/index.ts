import {
  addRecipeItem as addRecipeItemRequest,
  addRecipeItems as addRecipeItemsRequest,
  createRecipe as createRecipeRequest,
  getRecipeById as getRecipeByIdRequest,
  getStoreRecipes as getStoreRecipesRequest,
  removeRecipeItem as removeRecipeItemRequest,
  updateRecipe as updateRecipeRequest,
  updateRecipeItem as updateRecipeItemRequest,
} from "@/api/recipes/methods";
import {
  RecipeSchema,
  type AddRecipeItemPayload,
  type AddRecipeItemsPayload,
  type CreateRecipePayload,
  type ListRecipesParams,
  type Recipe,
  type UpdateRecipePayload,
} from "@/api/recipes/schema";
import type { PaginationMeta } from "@/api/shared/contracts";

const INVALID = "Resposta inválida do servidor de receitas.";

function parse(value: unknown): Recipe {
  const parsed = RecipeSchema.safeParse(value);
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export interface RecipesResult {
  items: Recipe[];
  pagination: PaginationMeta;
}

export async function fetchRecipes(
  params: ListRecipesParams,
): Promise<RecipesResult> {
  const response = await getStoreRecipesRequest(params);
  const parsed = RecipeSchema.array().safeParse(response.items);
  if (!parsed.success) throw new Error(INVALID);
  return {
    items: parsed.data,
    pagination: {
      total: response.total,
      currentPage: response.currentPage,
      limit: response.limit,
      totalPages: response.totalPages,
      hasNextPage: response.hasNextPage,
    },
  };
}

export const fetchRecipeById = async (
  idStore: string,
  idRecipe: string,
): Promise<Recipe> => parse(await getRecipeByIdRequest(idStore, idRecipe));

export const createRecipe = async (
  payload: CreateRecipePayload,
): Promise<Recipe> => parse(await createRecipeRequest(payload));

export const updateRecipe = async (
  payload: UpdateRecipePayload,
): Promise<Recipe> => parse(await updateRecipeRequest(payload));

export const addRecipeItem = async (
  payload: AddRecipeItemPayload,
): Promise<Recipe> => parse(await addRecipeItemRequest(payload));

export const addRecipeItems = async (
  payload: AddRecipeItemsPayload,
): Promise<Recipe> => parse(await addRecipeItemsRequest(payload));

export const updateRecipeItem = async (
  idStore: string,
  idRecipe: string,
  idRecipeItem: string,
  quantity: number,
): Promise<Recipe> =>
  parse(
    await updateRecipeItemRequest(idStore, idRecipe, idRecipeItem, quantity),
  );

export const removeRecipeItem = async (
  idStore: string,
  idRecipe: string,
  idRecipeItem: string,
): Promise<Recipe> =>
  parse(await removeRecipeItemRequest(idStore, idRecipe, idRecipeItem));

export type { Recipe, RecipeItem } from "@/api/recipes/schema";
