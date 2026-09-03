import {
  createSupplier as createSupplierRequest,
  getStoreSupplierFilterOptions as getStoreSupplierFilterOptionsRequest,
  getStoreSuppliers as getStoreSuppliersRequest,
  getSupplierById as getSupplierByIdRequest,
  updateSupplier as updateSupplierRequest,
} from "@/api/suppliers/methods";
import {
  CreateSupplierPayloadSchema,
  SupplierFilterOptionsSchema,
  SupplierSchema,
  UpdateSupplierPayloadSchema,
  type CreateSupplierPayload,
  type ListSuppliersParams,
  type Supplier,
  type SupplierFilterOptions,
  type UpdateSupplierPayload,
} from "@/api/suppliers/schema";
import type { PaginationMeta } from "@/api/shared/contracts";

const INVALID = "Resposta inválida do servidor de fornecedores.";

export interface SuppliersResult {
  items: Supplier[];
  pagination: PaginationMeta;
}

export async function fetchSuppliers(
  params: ListSuppliersParams,
): Promise<SuppliersResult> {
  const response = await getStoreSuppliersRequest(params);
  const parsed = SupplierSchema.array().safeParse(response.items);
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

export async function fetchSupplierFilterOptions(
  idStore: string,
): Promise<SupplierFilterOptions> {
  const parsed = SupplierFilterOptionsSchema.safeParse(
    await getStoreSupplierFilterOptionsRequest(idStore),
  );
  if (!parsed.success) return { names: [], creators: [] };
  return parsed.data;
}

export async function fetchSupplierById(
  idStore: string,
  idSupplier: string,
): Promise<Supplier> {
  const parsed = SupplierSchema.safeParse(
    await getSupplierByIdRequest(idStore, idSupplier),
  );
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function createSupplier(
  payload: CreateSupplierPayload,
): Promise<Supplier> {
  const body = CreateSupplierPayloadSchema.parse(payload);
  const parsed = SupplierSchema.safeParse(await createSupplierRequest(body));
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function updateSupplier(
  payload: UpdateSupplierPayload,
): Promise<Supplier> {
  const body = UpdateSupplierPayloadSchema.parse(payload);
  const parsed = SupplierSchema.safeParse(await updateSupplierRequest(body));
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export type {
  Supplier,
  SupplierFilterOptions,
  SupplierUserOption,
} from "@/api/suppliers/schema";
