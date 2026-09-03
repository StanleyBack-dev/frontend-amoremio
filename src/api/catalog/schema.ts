import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const UnitOfMeasureSchema = z.enum([
  "UN",
  "KG",
  "G",
  "L",
  "ML",
  "CX",
  "FARDO",
  "PACOTE",
  "DUZIA",
]);

export const ProductKindSchema = z.enum([
  "INSUMO",
  "INTERMEDIARIO",
  "PRODUTO_FINAL",
  "REVENDA",
]);

export const PackagingUnitSchema = z.enum([
  "UNIDADE",
  "PACOTE",
  "CAIXA",
  "FARDO",
  "SACO",
  "GARRAFA",
  "LATA",
  "POTE",
  "DUZIA",
  "BANDEJA",
]);

export const ProductSchema = z.object({
  idProduct: z.string(),
  idStore: z.string(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  kind: ProductKindSchema,
  unit: UnitOfMeasureSchema,
  packagingUnit: PackagingUnitSchema.optional().default("UNIDADE"),
  packSize: z.number().optional().default(1),
  salePrice: z.number().nullable().optional(),
  status: z.boolean(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateProductPayloadSchema = z.object({
  idStore: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  kind: ProductKindSchema,
  unit: UnitOfMeasureSchema,
  packagingUnit: PackagingUnitSchema.optional(),
  packSize: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
});

export const UpdateProductPayloadSchema = z.object({
  idStore: z.string().min(1),
  idProduct: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  kind: ProductKindSchema.optional(),
  unit: UnitOfMeasureSchema.optional(),
  packagingUnit: PackagingUnitSchema.optional(),
  packSize: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  status: z.boolean().optional(),
});

export type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;
export type ProductKind = z.infer<typeof ProductKindSchema>;
export type PackagingUnit = z.infer<typeof PackagingUnitSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type CreateProductPayload = z.infer<typeof CreateProductPayloadSchema>;
export type UpdateProductPayload = z.infer<typeof UpdateProductPayloadSchema>;
export type ProductsResponse = PaginatedResponse<Product>;

export interface ListProductsParams {
  idStore: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  kinds?: ProductKind[];
  name?: string;
  brand?: string;
  withoutBrand?: boolean;
  unit?: UnitOfMeasure;
  createdByUserId?: string;
}

export const UserOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type UserOption = z.infer<typeof UserOptionSchema>;

export const ProductFilterOptionsSchema = z.object({
  names: z.array(z.string()),
  brands: z.array(z.string()),
  creators: z.array(UserOptionSchema),
});

export type ProductFilterOptions = z.infer<typeof ProductFilterOptionsSchema>;
