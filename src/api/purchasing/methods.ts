import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  AddPurchaseItemPayload,
  CreatePurchaseDraftPayload,
  ListPurchasesParams,
  Purchase,
  PurchaseFilterOptions,
  PurchasesResponse,
  UpdatePurchaseHeaderPayload,
} from "./schema";

const fail = (error: unknown, message: string) =>
  new Error(getApiErrorMessage(error, message));

export async function getStorePurchases(
  params: ListPurchasesParams,
): Promise<PurchasesResponse> {
  try {
    const response = await apiHttp.get<PurchasesResponse>("/purchases", {
      params,
    });
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível listar as compras.");
  }
}

export async function getStorePurchaseFilterOptions(
  idStore: string,
): Promise<PurchaseFilterOptions> {
  try {
    const response = await apiHttp.get<PurchaseFilterOptions>(
      "/purchases/filter-options",
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível carregar os filtros.");
  }
}

export async function getPurchaseById(
  idStore: string,
  idPurchase: string,
): Promise<Purchase> {
  try {
    const response = await apiHttp.get<Purchase>(`/purchases/${idPurchase}`, {
      params: { idStore },
    });
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível carregar a compra.");
  }
}

export async function createPurchaseDraft(
  payload: CreatePurchaseDraftPayload,
): Promise<Purchase> {
  try {
    const response = await apiHttp.post<Purchase>("/purchases", payload);
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível criar a compra.");
  }
}

export async function updatePurchaseHeader(
  payload: UpdatePurchaseHeaderPayload,
): Promise<Purchase> {
  try {
    const { idPurchase, ...body } = payload;
    const response = await apiHttp.patch<Purchase>(
      `/purchases/${idPurchase}/header`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível atualizar a compra.");
  }
}

export async function addPurchaseItem(
  payload: AddPurchaseItemPayload,
): Promise<Purchase> {
  try {
    const { idPurchase, ...body } = payload;
    const response = await apiHttp.post<Purchase>(
      `/purchases/${idPurchase}/items`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar o item.");
  }
}

export async function removePurchaseItem(
  idStore: string,
  idPurchase: string,
  idPurchaseItem: string,
): Promise<Purchase> {
  try {
    const response = await apiHttp.delete<Purchase>(
      `/purchases/${idPurchase}/items/${idPurchaseItem}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível remover o item.");
  }
}

export async function finalizePurchase(
  idStore: string,
  idPurchase: string,
): Promise<Purchase> {
  try {
    const response = await apiHttp.post<Purchase>(
      `/purchases/${idPurchase}/finalize`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível finalizar a compra.");
  }
}

export async function cancelPurchase(
  idStore: string,
  idPurchase: string,
): Promise<Purchase> {
  try {
    const response = await apiHttp.post<Purchase>(
      `/purchases/${idPurchase}/cancel`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível cancelar a compra.");
  }
}
