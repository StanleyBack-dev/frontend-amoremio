import {
  addShoppingListItem as addShoppingListItemRequest,
  addShoppingListItems as addShoppingListItemsRequest,
  cancelShoppingList as cancelShoppingListRequest,
  convertShoppingListToPurchase as convertShoppingListToPurchaseRequest,
  createShoppingList as createShoppingListRequest,
  getShoppingListById as getShoppingListByIdRequest,
  getShoppingListByPurchaseId as getShoppingListByPurchaseIdRequest,
  getStoreShoppingLists as getStoreShoppingListsRequest,
  removeShoppingListItem as removeShoppingListItemRequest,
  updateShoppingListItem as updateShoppingListItemRequest,
} from "@/api/shopping-list/methods";
import {
  ShoppingListSchema,
  type AddShoppingListItemPayload,
  type AddShoppingListItemsPayload,
  type CreateShoppingListPayload,
  type ListShoppingListsParams,
  type ShoppingList,
  type ShoppingListStatus,
  type UpdateShoppingListItemPayload,
} from "@/api/shopping-list/schema";

const INVALID = "Resposta inválida do servidor de listas de compras.";

function parse(value: unknown): ShoppingList {
  const parsed = ShoppingListSchema.safeParse(value);
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export interface ShoppingListsResult {
  items: ShoppingList[];
  pagination: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export async function fetchShoppingLists(
  params: ListShoppingListsParams,
): Promise<ShoppingListsResult> {
  const response = await getStoreShoppingListsRequest(params);
  const parsed = ShoppingListSchema.array().safeParse(response.items);
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

export const fetchShoppingListById = async (
  idStore: string,
  idShoppingList: string,
): Promise<ShoppingList> =>
  parse(await getShoppingListByIdRequest(idStore, idShoppingList));

export async function fetchShoppingListByPurchaseId(
  idStore: string,
  idPurchase: string,
): Promise<ShoppingList | null> {
  const found = await getShoppingListByPurchaseIdRequest(idStore, idPurchase);
  return found ? parse(found) : null;
}

export const createShoppingList = async (
  payload: CreateShoppingListPayload,
): Promise<ShoppingList> => parse(await createShoppingListRequest(payload));

export const addShoppingListItem = async (
  payload: AddShoppingListItemPayload,
): Promise<ShoppingList> => parse(await addShoppingListItemRequest(payload));

export const addShoppingListItems = async (
  payload: AddShoppingListItemsPayload,
): Promise<ShoppingList> => parse(await addShoppingListItemsRequest(payload));

export const updateShoppingListItem = async (
  payload: UpdateShoppingListItemPayload,
): Promise<ShoppingList> => parse(await updateShoppingListItemRequest(payload));

export const removeShoppingListItem = async (
  idStore: string,
  idShoppingList: string,
  idShoppingListItem: string,
): Promise<ShoppingList> =>
  parse(
    await removeShoppingListItemRequest(
      idStore,
      idShoppingList,
      idShoppingListItem,
    ),
  );

export const cancelShoppingList = async (
  idStore: string,
  idShoppingList: string,
): Promise<ShoppingList> =>
  parse(await cancelShoppingListRequest(idStore, idShoppingList));

export const convertShoppingListToPurchase = async (
  idStore: string,
  idShoppingList: string,
): Promise<ShoppingList> =>
  parse(await convertShoppingListToPurchaseRequest(idStore, idShoppingList));

export const shoppingListStatusLabel: Record<ShoppingListStatus, string> = {
  ABERTA: "Aberta",
  CONVERTIDA: "Convertida",
  CANCELADA: "Cancelada",
};
