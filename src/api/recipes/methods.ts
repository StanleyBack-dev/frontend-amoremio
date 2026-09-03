import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  AddRecipeItemPayload,
  AddRecipeItemsPayload,
  CreateRecipePayload,
  Recipe,
  RecipesResponse,
  ListRecipesParams,
  UpdateRecipePayload,
} from "./schema";

const fail = (error: unknown, message: string) =>
  new Error(getApiErrorMessage(error, message));

export async function getStoreRecipes(
  params: ListRecipesParams,
): Promise<RecipesResponse> {
  try {
    const response = await apiHttp.get<RecipesResponse>("/recipes", { params });
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível listar as receitas.");
  }
}

export async function getRecipeById(
  idStore: string,
  idRecipe: string,
): Promise<Recipe> {
  try {
    const response = await apiHttp.get<Recipe>(`/recipes/${idRecipe}`, {
      params: { idStore },
    });
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível carregar a receita.");
  }
}

export async function createRecipe(
  payload: CreateRecipePayload,
): Promise<Recipe> {
  try {
    const response = await apiHttp.post<Recipe>("/recipes", payload);
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível criar a receita.");
  }
}

export async function updateRecipe(
  payload: UpdateRecipePayload,
): Promise<Recipe> {
  try {
    const { idRecipe, ...body } = payload;
    const response = await apiHttp.patch<Recipe>(`/recipes/${idRecipe}`, body);
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível atualizar a receita.");
  }
}

export async function addRecipeItem(
  payload: AddRecipeItemPayload,
): Promise<Recipe> {
  try {
    const { idRecipe, ...body } = payload;
    const response = await apiHttp.post<Recipe>(
      `/recipes/${idRecipe}/items`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar o ingrediente.");
  }
}

export async function addRecipeItems(
  payload: AddRecipeItemsPayload,
): Promise<Recipe> {
  try {
    const { idRecipe, ...body } = payload;
    const response = await apiHttp.post<Recipe>(
      `/recipes/${idRecipe}/items/bulk`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar os ingredientes.");
  }
}

export async function updateRecipeItem(
  idStore: string,
  idRecipe: string,
  idRecipeItem: string,
  quantity: number,
): Promise<Recipe> {
  try {
    const response = await apiHttp.patch<Recipe>(
      `/recipes/${idRecipe}/items/${idRecipeItem}`,
      { idStore, quantity },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível atualizar o ingrediente.");
  }
}

export async function removeRecipeItem(
  idStore: string,
  idRecipe: string,
  idRecipeItem: string,
): Promise<Recipe> {
  try {
    const response = await apiHttp.delete<Recipe>(
      `/recipes/${idRecipe}/items/${idRecipeItem}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível remover o ingrediente.");
  }
}
