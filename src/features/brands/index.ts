import {
  createBrand as createBrandRequest,
  getBrandById as getBrandByIdRequest,
  getStoreBrandFilterOptions as getStoreBrandFilterOptionsRequest,
  getStoreBrands as getStoreBrandsRequest,
  updateBrand as updateBrandRequest,
} from "@/api/brands/methods";
import {
  BrandFilterOptionsSchema,
  BrandSchema,
  CreateBrandPayloadSchema,
  UpdateBrandPayloadSchema,
  type Brand,
  type BrandFilterOptions,
  type CreateBrandPayload,
  type ListBrandsParams,
  type UpdateBrandPayload,
} from "@/api/brands/schema";
import type { PaginationMeta } from "@/api/shared/contracts";

const INVALID = "Resposta inválida do servidor de marcas.";

export interface BrandsResult {
  items: Brand[];
  pagination: PaginationMeta;
}

export async function fetchBrands(
  params: ListBrandsParams,
): Promise<BrandsResult> {
  const response = await getStoreBrandsRequest(params);
  const parsed = BrandSchema.array().safeParse(response.items);
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

export async function fetchBrandFilterOptions(
  idStore: string,
): Promise<BrandFilterOptions> {
  const parsed = BrandFilterOptionsSchema.safeParse(
    await getStoreBrandFilterOptionsRequest(idStore),
  );
  if (!parsed.success) return { names: [], creators: [] };
  return parsed.data;
}

export async function fetchBrandById(
  idStore: string,
  idBrand: string,
): Promise<Brand> {
  const parsed = BrandSchema.safeParse(
    await getBrandByIdRequest(idStore, idBrand),
  );
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function createBrand(payload: CreateBrandPayload): Promise<Brand> {
  const body = CreateBrandPayloadSchema.parse(payload);
  const parsed = BrandSchema.safeParse(await createBrandRequest(body));
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function updateBrand(payload: UpdateBrandPayload): Promise<Brand> {
  const body = UpdateBrandPayloadSchema.parse(payload);
  const parsed = BrandSchema.safeParse(await updateBrandRequest(body));
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export type {
  Brand,
  BrandFilterOptions,
  BrandUserOption,
} from "@/api/brands/schema";
