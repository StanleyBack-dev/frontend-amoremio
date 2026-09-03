import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const SupplierSchema = z.object({
  idSupplier: z.string(),
  idStore: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.boolean(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateSupplierPayloadSchema = z.object({
  idStore: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  instagram: z.string().optional(),
  document: z.string().optional(),
  notes: z.string().optional(),
  status: z.boolean().optional(),
});

export const UpdateSupplierPayloadSchema = z.object({
  idStore: z.string().min(1),
  idSupplier: z.string().min(1),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  instagram: z.string().optional(),
  document: z.string().optional(),
  notes: z.string().optional(),
  status: z.boolean().optional(),
});

export type Supplier = z.infer<typeof SupplierSchema>;
export type CreateSupplierPayload = z.infer<typeof CreateSupplierPayloadSchema>;
export type UpdateSupplierPayload = z.infer<typeof UpdateSupplierPayloadSchema>;
export type SuppliersResponse = PaginatedResponse<Supplier>;

export interface ListSuppliersParams {
  idStore: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
}

export const SupplierUserOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type SupplierUserOption = z.infer<typeof SupplierUserOptionSchema>;

export const SupplierFilterOptionsSchema = z.object({
  names: z.array(z.string()),
  creators: z.array(SupplierUserOptionSchema),
});

export type SupplierFilterOptions = z.infer<typeof SupplierFilterOptionsSchema>;
