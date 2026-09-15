import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  MapChannelProductPayload,
  MapChannelProductResult,
  UnmappedChannelProduct,
} from "./schema";

export async function getUnmappedChannelProducts(
  idStore: string,
): Promise<UnmappedChannelProduct[]> {
  try {
    const response = await apiHttp.get<UnmappedChannelProduct[]>(
      "/channel-orders/unmapped-products",
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Não foi possível carregar os pedidos pendentes de mapeamento.",
      ),
    );
  }
}

export async function mapChannelProduct(
  payload: MapChannelProductPayload,
): Promise<MapChannelProductResult> {
  try {
    const response = await apiHttp.post<MapChannelProductResult>(
      "/channel-orders/map-product",
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível salvar o mapeamento."),
    );
  }
}
