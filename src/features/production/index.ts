import {
  cancelProductionOrder as cancelProductionOrderRequest,
  completeProductionOrder as completeProductionOrderRequest,
  createProductionOrder as createProductionOrderRequest,
  getProductionOrderById as getProductionOrderByIdRequest,
  getStoreProductionOrderFilterOptions as getStoreProductionOrderFilterOptionsRequest,
  getStoreProductionOrders as getStoreProductionOrdersRequest,
  updateProductionOrder as updateProductionOrderRequest,
} from "@/api/production/methods";
import {
  ProductionOrderFilterOptionsSchema,
  ProductionOrderSchema,
  type CreateProductionOrderPayload,
  type ListProductionOrdersParams,
  type ProductionOrder,
  type ProductionOrderFilterOptions,
  type ProductionOrderStatus,
  type UpdateProductionOrderPayload,
} from "@/api/production/schema";

const INVALID = "Resposta inválida do servidor de produção.";

function parse(value: unknown): ProductionOrder {
  const parsed = ProductionOrderSchema.safeParse(value);
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export interface ProductionOrdersResult {
  items: ProductionOrder[];
  pagination: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export async function fetchProductionOrders(
  params: ListProductionOrdersParams,
): Promise<ProductionOrdersResult> {
  const response = await getStoreProductionOrdersRequest(params);
  const parsed = ProductionOrderSchema.array().safeParse(response.items);
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

export async function fetchProductionOrderFilterOptions(
  idStore: string,
): Promise<ProductionOrderFilterOptions> {
  const parsed = ProductionOrderFilterOptionsSchema.safeParse(
    await getStoreProductionOrderFilterOptionsRequest(idStore),
  );
  if (!parsed.success) return { recipes: [], creators: [] };
  return parsed.data;
}

export const fetchProductionOrderById = async (
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrder> =>
  parse(await getProductionOrderByIdRequest(idStore, idProductionOrder));

export const createProductionOrder = async (
  payload: CreateProductionOrderPayload,
): Promise<ProductionOrder> =>
  parse(await createProductionOrderRequest(payload));

export const updateProductionOrder = async (
  payload: UpdateProductionOrderPayload,
): Promise<ProductionOrder> =>
  parse(await updateProductionOrderRequest(payload));

export const completeProductionOrder = async (
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrder> =>
  parse(await completeProductionOrderRequest(idStore, idProductionOrder));

export const cancelProductionOrder = async (
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrder> =>
  parse(await cancelProductionOrderRequest(idStore, idProductionOrder));

export const productionOrderStatusLabel: Record<ProductionOrderStatus, string> =
  {
    RASCUNHO: "Rascunho",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

export type {
  ProductionOrder,
  ProductionOrderItem,
  ProductionOrderStatus,
} from "@/api/production/schema";
