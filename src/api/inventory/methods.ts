import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  AdjustStockPayload,
  ListStockMovementsParams,
  ListStoreStockParams,
} from "./schema";

export async function getStoreStock(
  params: ListStoreStockParams,
): Promise<unknown> {
  try {
    const response = await apiHttp.get("/inventory/stock", { params });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar o estoque."),
    );
  }
}

export async function getStockMovements(
  params: ListStockMovementsParams,
): Promise<unknown> {
  try {
    const response = await apiHttp.get("/inventory/movements", { params });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar as movimentações."),
    );
  }
}

export async function adjustStock(payload: AdjustStockPayload): Promise<void> {
  try {
    await apiHttp.post("/inventory/adjust", payload);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível ajustar o estoque."),
    );
  }
}
