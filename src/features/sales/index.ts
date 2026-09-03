import {
  addSalesOrderItem as addSalesOrderItemRequest,
  cancelSalesOrder as cancelSalesOrderRequest,
  confirmSalesOrder as confirmSalesOrderRequest,
  createSalesOrder as createSalesOrderRequest,
  getSalesOrderById as getSalesOrderByIdRequest,
  getStoreSalesOrders as getStoreSalesOrdersRequest,
  getStoreSalesOrderFilterOptions as getStoreSalesOrderFilterOptionsRequest,
  removeSalesOrderItem as removeSalesOrderItemRequest,
  updateSalesOrderHeader as updateSalesOrderHeaderRequest,
} from "@/api/sales/methods";
import {
  SalesOrderFilterOptionsSchema,
  SalesOrderSchema,
  type AddSalesOrderItemPayload,
  type CreateSalesOrderPayload,
  type ListSalesOrdersParams,
  type SalesChannel,
  type SalesOrder,
  type SalesOrderFilterOptions,
  type SalesOrderStatus,
  type UpdateSalesOrderHeaderPayload,
} from "@/api/sales/schema";

const INVALID = "Resposta inválida do servidor de vendas.";

function parse(value: unknown): SalesOrder {
  const parsed = SalesOrderSchema.safeParse(value);
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export interface SalesOrdersResult {
  items: SalesOrder[];
  pagination: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export async function fetchSalesOrders(
  params: ListSalesOrdersParams,
): Promise<SalesOrdersResult> {
  const response = await getStoreSalesOrdersRequest(params);
  const parsed = SalesOrderSchema.array().safeParse(response.items);
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

export async function fetchSalesOrderFilterOptions(
  idStore: string,
): Promise<SalesOrderFilterOptions> {
  const parsed = SalesOrderFilterOptionsSchema.safeParse(
    await getStoreSalesOrderFilterOptionsRequest(idStore),
  );
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export const fetchSalesOrderById = async (
  idStore: string,
  idSalesOrder: string,
): Promise<SalesOrder> =>
  parse(await getSalesOrderByIdRequest(idStore, idSalesOrder));

export const createSalesOrder = async (
  payload: CreateSalesOrderPayload,
): Promise<SalesOrder> => parse(await createSalesOrderRequest(payload));

export const updateSalesOrderHeader = async (
  payload: UpdateSalesOrderHeaderPayload,
): Promise<SalesOrder> => parse(await updateSalesOrderHeaderRequest(payload));

export const addSalesOrderItem = async (
  payload: AddSalesOrderItemPayload,
): Promise<SalesOrder> => parse(await addSalesOrderItemRequest(payload));

export const removeSalesOrderItem = async (
  idStore: string,
  idSalesOrder: string,
  idSalesOrderItem: string,
): Promise<SalesOrder> =>
  parse(
    await removeSalesOrderItemRequest(idStore, idSalesOrder, idSalesOrderItem),
  );

export const confirmSalesOrder = async (
  idStore: string,
  idSalesOrder: string,
): Promise<SalesOrder> =>
  parse(await confirmSalesOrderRequest(idStore, idSalesOrder));

export const cancelSalesOrder = async (
  idStore: string,
  idSalesOrder: string,
): Promise<SalesOrder> =>
  parse(await cancelSalesOrderRequest(idStore, idSalesOrder));

export const salesOrderStatusLabel: Record<SalesOrderStatus, string> = {
  ABERTA: "Aberta",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
};

export const salesChannelLabel: Record<SalesChannel, string> = {
  BALCAO: "Balcão",
  IFOOD: "iFood",
  RAPPI: "Rappi",
  FOOD_99: "99Food",
  UBER_EATS: "Uber Eats",
  AIQFOME: "aiqfome",
  WHATSAPP: "WhatsApp",
  TELEFONE: "Telefone",
  OUTRO: "Outro",
};

export const salesChannelOptions: { value: SalesChannel; label: string }[] = (
  Object.keys(salesChannelLabel) as SalesChannel[]
).map((value) => ({ value, label: salesChannelLabel[value] }));

export type { SalesChannel } from "@/api/sales/schema";

export function calcSalesLineTotal(
  quantity: number,
  unitPrice: number,
): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}
