import { z } from "zod";
import type { PaginatedResponse } from "../shared/contracts";

export const CustomerSchema = z.object({
  idCustomer: z.string(),
  idStore: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.boolean(),
  createdByUserId: z.string(),
  createdByUserName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateCustomerPayloadSchema = z.object({
  idStore: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.boolean().optional(),
});

export const UpdateCustomerPayloadSchema = z.object({
  idStore: z.string().min(1),
  idCustomer: z.string().min(1),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.boolean().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomerPayload = z.infer<typeof CreateCustomerPayloadSchema>;
export type UpdateCustomerPayload = z.infer<typeof UpdateCustomerPayloadSchema>;
export type CustomersResponse = PaginatedResponse<Customer>;

export interface ListCustomersParams {
  idStore: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  name?: string;
  createdByUserId?: string;
}

export const CustomerUserOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type CustomerUserOption = z.infer<typeof CustomerUserOptionSchema>;

export const CustomerFilterOptionsSchema = z.object({
  names: z.array(z.string()),
  creators: z.array(CustomerUserOptionSchema),
});

export type CustomerFilterOptions = z.infer<typeof CustomerFilterOptionsSchema>;
