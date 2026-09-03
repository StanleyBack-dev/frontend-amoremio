import {
  createProduct as createProductRequest,
  getProductById as getProductByIdRequest,
  getStoreProductFilterOptions as getStoreProductFilterOptionsRequest,
  getStoreProducts as getStoreProductsRequest,
  updateProduct as updateProductRequest,
} from "@/api/catalog/methods";
import {
  CreateProductPayloadSchema,
  ProductFilterOptionsSchema,
  ProductSchema,
  UpdateProductPayloadSchema,
  type CreateProductPayload,
  type ListProductsParams,
  type Product,
  type ProductFilterOptions,
  type UpdateProductPayload,
} from "@/api/catalog/schema";
import type { PaginationMeta } from "@/api/shared/contracts";

const INVALID = "Resposta inválida do servidor de produtos.";

export interface ProductsResult {
  items: Product[];
  pagination: PaginationMeta;
}

export async function fetchProducts(
  params: ListProductsParams,
): Promise<ProductsResult> {
  const response = await getStoreProductsRequest(params);
  const parsed = ProductSchema.array().safeParse(response.items);
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

export async function fetchProductFilterOptions(
  idStore: string,
): Promise<ProductFilterOptions> {
  const parsed = ProductFilterOptionsSchema.safeParse(
    await getStoreProductFilterOptionsRequest(idStore),
  );
  if (!parsed.success) return { names: [], brands: [], creators: [] };
  return parsed.data;
}

export async function fetchProductById(
  idStore: string,
  idProduct: string,
): Promise<Product> {
  const parsed = ProductSchema.safeParse(
    await getProductByIdRequest(idStore, idProduct),
  );
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<Product> {
  const body = CreateProductPayloadSchema.parse(payload);
  const parsed = ProductSchema.safeParse(await createProductRequest(body));
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function updateProduct(
  payload: UpdateProductPayload,
): Promise<Product> {
  const body = UpdateProductPayloadSchema.parse(payload);
  const parsed = ProductSchema.safeParse(await updateProductRequest(body));
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

import { unitLabel as unitLabelMap } from "./model/units";

// Label for a product inside a picker: name + brand + stock unit, so two
// products that share a name (different brands) can be told apart.
export function productOptionLabel(
  product: Pick<Product, "name" | "brand" | "unit">,
): string {
  const brand = product.brand?.trim();
  return `${product.name}${brand ? ` · ${brand}` : ""} (${unitLabelMap[product.unit]})`;
}

export { unitLabel, unitOptions } from "./model/units";
export {
  packagingUnitLabel,
  packagingUnitLabelPlural,
  packagingUnitOptions,
  packagingCountLabel,
} from "./model/packaging";
export {
  kindLabel,
  kindShortLabel,
  kindOptions,
  kindTone,
  PURCHASABLE_KINDS,
  SELLABLE_KINDS,
  RECIPE_INPUT_KINDS,
  RECIPE_OUTPUT_KINDS,
} from "./model/kinds";
