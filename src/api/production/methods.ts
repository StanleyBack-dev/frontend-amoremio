import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  CreateProductionOrderPayload,
  ListProductionOrdersParams,
  ProductionOrder,
  ProductionOrderFilterOptions,
  ProductionOrdersResponse,
  UpdateProductionOrderPayload,
} from "./schema";

const fail = (error: unknown, message: string) =>
  new Error(getApiErrorMessage(error, message));

export async function getStoreProductionOrders(
  params: ListProductionOrdersParams,
): Promise<ProductionOrdersResponse> {
  try {
    const response = await apiHttp.get<ProductionOrdersResponse>(
      "/production-orders",
      { params },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível listar as ordens de produção.");
  }
}

export async function getStoreProductionOrderFilterOptions(
  idStore: string,
): Promise<ProductionOrderFilterOptions> {
  try {
    const response = await apiHttp.get<ProductionOrderFilterOptions>(
      "/production-orders/filter-options",
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível carregar os filtros.");
  }
}

export async function getProductionOrderById(
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.get<ProductionOrder>(
      `/production-orders/${idProductionOrder}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível carregar a ordem de produção.");
  }
}

export async function createProductionOrder(
  payload: CreateProductionOrderPayload,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.post<ProductionOrder>(
      "/production-orders",
      payload,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível criar a ordem de produção.");
  }
}

export async function updateProductionOrder(
  payload: UpdateProductionOrderPayload,
): Promise<ProductionOrder> {
  try {
    const { idProductionOrder, ...body } = payload;
    const response = await apiHttp.patch<ProductionOrder>(
      `/production-orders/${idProductionOrder}`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível atualizar a ordem de produção.");
  }
}

export async function completeProductionOrder(
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.post<ProductionOrder>(
      `/production-orders/${idProductionOrder}/complete`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível concluir a produção.");
  }
}

export async function cancelProductionOrder(
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.post<ProductionOrder>(
      `/production-orders/${idProductionOrder}/cancel`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível cancelar a ordem de produção.");
  }
}
