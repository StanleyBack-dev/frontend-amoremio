import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  AddSalesOrderItemPayload,
  CreateSalesOrderPayload,
  ListSalesOrdersParams,
  SalesOrder,
  SalesOrderFilterOptions,
  SalesOrdersResponse,
  UpdateSalesOrderHeaderPayload,
} from "./schema";

const fail = (error: unknown, message: string) =>
  new Error(getApiErrorMessage(error, message));

export async function getStoreSalesOrders(
  params: ListSalesOrdersParams,
): Promise<SalesOrdersResponse> {
  try {
    const response = await apiHttp.get<SalesOrdersResponse>("/sales-orders", {
      params,
    });
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível listar as vendas.");
  }
}

export async function getStoreSalesOrderFilterOptions(
  idStore: string,
): Promise<SalesOrderFilterOptions> {
  try {
    const response = await apiHttp.get<SalesOrderFilterOptions>(
      "/sales-orders/filter-options",
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível carregar os filtros de vendas.");
  }
}

export async function getSalesOrderById(
  idStore: string,
  idSalesOrder: string,
): Promise<SalesOrder> {
  try {
    const response = await apiHttp.get<SalesOrder>(
      `/sales-orders/${idSalesOrder}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível carregar a venda.");
  }
}

export async function createSalesOrder(
  payload: CreateSalesOrderPayload,
): Promise<SalesOrder> {
  try {
    const response = await apiHttp.post<SalesOrder>("/sales-orders", payload);
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível criar a venda.");
  }
}

export async function updateSalesOrderHeader(
  payload: UpdateSalesOrderHeaderPayload,
): Promise<SalesOrder> {
  try {
    const { idSalesOrder, ...body } = payload;
    const response = await apiHttp.patch<SalesOrder>(
      `/sales-orders/${idSalesOrder}/header`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível atualizar a venda.");
  }
}

export async function addSalesOrderItem(
  payload: AddSalesOrderItemPayload,
): Promise<SalesOrder> {
  try {
    const { idSalesOrder, ...body } = payload;
    const response = await apiHttp.post<SalesOrder>(
      `/sales-orders/${idSalesOrder}/items`,
      body,
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível adicionar o item.");
  }
}

export async function removeSalesOrderItem(
  idStore: string,
  idSalesOrder: string,
  idSalesOrderItem: string,
): Promise<SalesOrder> {
  try {
    const response = await apiHttp.delete<SalesOrder>(
      `/sales-orders/${idSalesOrder}/items/${idSalesOrderItem}`,
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível remover o item.");
  }
}

export async function confirmSalesOrder(
  idStore: string,
  idSalesOrder: string,
): Promise<SalesOrder> {
  try {
    const response = await apiHttp.post<SalesOrder>(
      `/sales-orders/${idSalesOrder}/confirm`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível confirmar a venda.");
  }
}

export async function cancelSalesOrder(
  idStore: string,
  idSalesOrder: string,
): Promise<SalesOrder> {
  try {
    const response = await apiHttp.post<SalesOrder>(
      `/sales-orders/${idSalesOrder}/cancel`,
      { idStore },
    );
    return response.data;
  } catch (error) {
    throw fail(error, "Não foi possível cancelar a venda.");
  }
}
