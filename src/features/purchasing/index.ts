import {
  addPurchaseItem as addPurchaseItemRequest,
  cancelPurchase as cancelPurchaseRequest,
  createPurchaseDraft as createPurchaseDraftRequest,
  finalizePurchase as finalizePurchaseRequest,
  getPurchaseById as getPurchaseByIdRequest,
  getStorePurchaseFilterOptions as getStorePurchaseFilterOptionsRequest,
  getStorePurchases as getStorePurchasesRequest,
  removePurchaseItem as removePurchaseItemRequest,
  updatePurchaseHeader as updatePurchaseHeaderRequest,
} from "@/api/purchasing/methods";
import {
  PurchaseFilterOptionsSchema,
  PurchaseSchema,
  type AddPurchaseItemPayload,
  type CreatePurchaseDraftPayload,
  type ListPurchasesParams,
  type Purchase,
  type PurchaseFilterOptions,
  type PurchaseStatus,
  type UpdatePurchaseHeaderPayload,
} from "@/api/purchasing/schema";

const INVALID = "Resposta inválida do servidor de compras.";

function parse(value: unknown): Purchase {
  const parsed = PurchaseSchema.safeParse(value);
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export interface PurchasesResult {
  items: Purchase[];
  pagination: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export async function fetchPurchases(
  params: ListPurchasesParams,
): Promise<PurchasesResult> {
  const response = await getStorePurchasesRequest(params);
  const parsed = PurchaseSchema.array().safeParse(response.items);
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

export async function fetchPurchaseFilterOptions(
  idStore: string,
): Promise<PurchaseFilterOptions> {
  const parsed = PurchaseFilterOptionsSchema.safeParse(
    await getStorePurchaseFilterOptionsRequest(idStore),
  );
  if (!parsed.success) return { suppliers: [], creators: [] };
  return parsed.data;
}

export const fetchPurchaseById = async (
  idStore: string,
  idPurchase: string,
): Promise<Purchase> =>
  parse(await getPurchaseByIdRequest(idStore, idPurchase));

export const createPurchaseDraft = async (
  payload: CreatePurchaseDraftPayload,
): Promise<Purchase> => parse(await createPurchaseDraftRequest(payload));

export const updatePurchaseHeader = async (
  payload: UpdatePurchaseHeaderPayload,
): Promise<Purchase> => parse(await updatePurchaseHeaderRequest(payload));

export const addPurchaseItem = async (
  payload: AddPurchaseItemPayload,
): Promise<Purchase> => parse(await addPurchaseItemRequest(payload));

export const removePurchaseItem = async (
  idStore: string,
  idPurchase: string,
  idPurchaseItem: string,
): Promise<Purchase> =>
  parse(await removePurchaseItemRequest(idStore, idPurchase, idPurchaseItem));

export const finalizePurchase = async (
  idStore: string,
  idPurchase: string,
): Promise<Purchase> =>
  parse(await finalizePurchaseRequest(idStore, idPurchase));

export const cancelPurchase = async (
  idStore: string,
  idPurchase: string,
): Promise<Purchase> => parse(await cancelPurchaseRequest(idStore, idPurchase));

export const purchaseStatusLabel: Record<PurchaseStatus, string> = {
  RASCUNHO: "Rascunho",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

// Mirror of the backend PurchaseCalculatorService, used only to show the
// running total while editing. The backend recomputes authoritatively on
// finalize.
export function calcRunningTotal(input: {
  itemsSubtotal: number;
  freightAmount: number;
  discountAmount: number;
}): number {
  return Math.max(
    Math.round(
      (input.itemsSubtotal + input.freightAmount - input.discountAmount) * 100,
    ) / 100,
    0,
  );
}

export function calcLineTotal(
  purchasedQuantity: number,
  unitPrice: number,
): number {
  return Math.round(purchasedQuantity * unitPrice * 100) / 100;
}
