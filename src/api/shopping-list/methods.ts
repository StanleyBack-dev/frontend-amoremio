import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  AddShoppingListItemPayload,
  AddShoppingListItemsPayload,
  CreateShoppingListPayload,
  ListShoppingListsParams,
  ShoppingList,
  ShoppingListsResponse,
  UpdateShoppingListItemPayload,
} from "./schema";

const fail = (error: unknown, message: string) =>
  new Error(getApiErrorMessage(error, message));

export async function getStoreShoppingLists(
  params: ListShoppingListsParams,
): Promise<ShoppingListsResponse> {
  try {
    const response = await apiHttp.get<ShoppingListsResponse>(
      "/shopping-lists",
      { params },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível listar as listas de compras.");
  }
}

export async function getShoppingListById(
  idStore: string,
  idShoppingList: string,
): Promise<ShoppingList> {
  try {
    const response = await apiHttp.get<ShoppingList>(
      `/shopping-lists/${idShoppingList}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível carregar a lista de compras.");
  }
}

// Null is a normal result — most purchases aren't linked to a list.
export async function getShoppingListByPurchaseId(
  idStore: string,
  idPurchase: string,
): Promise<ShoppingList | null> {
  try {
    const response = await apiHttp.get<ShoppingList | null>(
      `/shopping-lists/by-purchase/${idPurchase}`,
      { params: { idStore } },
    );
    return response.data ?? null;
  } catch (error) {
    throw fail(
      error,
      "Não foi possível verificar a lista de compras vinculada.",
    );
  }
}

export async function createShoppingList(
  payload: CreateShoppingListPayload,
): Promise<ShoppingList> {
  try {
    const response = await apiHttp.post<ShoppingList>(
      "/shopping-lists",
      payload,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível criar a lista de compras.");
  }
}

export async function addShoppingListItem(
  payload: AddShoppingListItemPayload,
): Promise<ShoppingList> {
  try {
    const { idShoppingList, ...body } = payload;
    const response = await apiHttp.post<ShoppingList>(
      `/shopping-lists/${idShoppingList}/items`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar o item.");
  }
}

export async function addShoppingListItems(
  payload: AddShoppingListItemsPayload,
): Promise<ShoppingList> {
  try {
    const { idShoppingList, ...body } = payload;
    const response = await apiHttp.post<ShoppingList>(
      `/shopping-lists/${idShoppingList}/items/bulk`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar os itens.");
  }
}

export async function updateShoppingListItem(
  payload: UpdateShoppingListItemPayload,
): Promise<ShoppingList> {
  try {
    const { idShoppingList, idShoppingListItem, ...body } = payload;
    const response = await apiHttp.patch<ShoppingList>(
      `/shopping-lists/${idShoppingList}/items/${idShoppingListItem}`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível atualizar o item.");
  }
}

export async function removeShoppingListItem(
  idStore: string,
  idShoppingList: string,
  idShoppingListItem: string,
): Promise<ShoppingList> {
  try {
    const response = await apiHttp.delete<ShoppingList>(
      `/shopping-lists/${idShoppingList}/items/${idShoppingListItem}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível remover o item.");
  }
}

export async function cancelShoppingList(
  idStore: string,
  idShoppingList: string,
): Promise<ShoppingList> {
  try {
    const response = await apiHttp.post<ShoppingList>(
      `/shopping-lists/${idShoppingList}/cancel`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível cancelar a lista de compras.");
  }
}

export async function convertShoppingListToPurchase(
  idStore: string,
  idShoppingList: string,
): Promise<ShoppingList> {
  try {
    const response = await apiHttp.post<ShoppingList>(
      `/shopping-lists/${idShoppingList}/convert`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível converter a lista em compra.");
  }
}
