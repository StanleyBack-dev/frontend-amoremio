import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const BrandSchema = z.object({
  idBrand: z.string(),
  idStore: z.string(),
  name: z.string(),
  status: z.boolean(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateBrandPayloadSchema = z.object({
  idStore: z.string().min(1),
  name: z.string().min(1),
  status: z.boolean().optional(),
});

export const UpdateBrandPayloadSchema = z.object({
  idStore: z.string().min(1),
  idBrand: z.string().min(1),
  name: z.string().min(1).optional(),
  status: z.boolean().optional(),
});

export type Brand = z.infer<typeof BrandSchema>;
export type CreateBrandPayload = z.infer<typeof CreateBrandPayloadSchema>;
export type UpdateBrandPayload = z.infer<typeof UpdateBrandPayloadSchema>;
export type BrandsResponse = PaginatedResponse<Brand>;

export interface ListBrandsParams {
  idStore: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
}

export const BrandUserOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type BrandUserOption = z.infer<typeof BrandUserOptionSchema>;

export const BrandFilterOptionsSchema = z.object({
  names: z.array(z.string()),
  creators: z.array(BrandUserOptionSchema),
});

export type BrandFilterOptions = z.infer<typeof BrandFilterOptionsSchema>;
