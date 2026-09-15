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

export async function addProductionOrderItem(
  idStore: string,
  idProductionOrder: string,
  idProduct: string,
  quantity: number,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.post<ProductionOrder>(
      `/production-orders/${idProductionOrder}/items`,
      { idStore, idProduct, quantity },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar o insumo.");
  }
}

export async function removeProductionOrderItem(
  idStore: string,
  idProductionOrder: string,
  idProductionOrderItem: string,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.delete<ProductionOrder>(
      `/production-orders/${idProductionOrder}/items/${idProductionOrderItem}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível remover o insumo.");
  }
}

export async function addProductionOrderOutput(
  idStore: string,
  idProductionOrder: string,
  idProduct: string,
  quantity: number,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.post<ProductionOrder>(
      `/production-orders/${idProductionOrder}/outputs`,
      { idStore, idProduct, quantity },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar a saída.");
  }
}

export async function removeProductionOrderOutput(
  idStore: string,
  idProductionOrder: string,
  idProductionOrderOutput: string,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.delete<ProductionOrder>(
      `/production-orders/${idProductionOrder}/outputs/${idProductionOrderOutput}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível remover a saída.");
  }
}

export async function addProductionOrderOutputExtra(
  idStore: string,
  idProductionOrder: string,
  idProductionOrderOutput: string,
  idProduct: string,
  quantity: number,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.post<ProductionOrder>(
      `/production-orders/${idProductionOrder}/outputs/${idProductionOrderOutput}/extras`,
      { idStore, idProduct, quantity },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar o insumo extra.");
  }
}

export async function removeProductionOrderOutputExtra(
  idStore: string,
  idProductionOrder: string,
  idProductionOrderOutput: string,
  idProductionOrderOutputExtra: string,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.delete<ProductionOrder>(
      `/production-orders/${idProductionOrder}/outputs/${idProductionOrderOutput}/extras/${idProductionOrderOutputExtra}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível remover o insumo extra.");
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

export async function duplicateProductionOrder(
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.post<ProductionOrder>(
      `/production-orders/${idProductionOrder}/duplicate`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível duplicar a produção.");
  }
}

export async function syncProductionOrderWithRecipe(
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrder> {
  try {
    const response = await apiHttp.post<ProductionOrder>(
      `/production-orders/${idProductionOrder}/sync-with-recipe`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível sincronizar com a receita.");
  }
}
