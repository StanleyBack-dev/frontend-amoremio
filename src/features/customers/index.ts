import {
  createCustomer as createCustomerRequest,
  getStoreCustomerFilterOptions as getStoreCustomerFilterOptionsRequest,
  getStoreCustomers as getStoreCustomersRequest,
  getCustomerById as getCustomerByIdRequest,
  updateCustomer as updateCustomerRequest,
} from "@/api/customers/methods";
import {
  CreateCustomerPayloadSchema,
  CustomerFilterOptionsSchema,
  CustomerSchema,
  UpdateCustomerPayloadSchema,
  type CreateCustomerPayload,
  type Customer,
  type CustomerFilterOptions,
  type ListCustomersParams,
  type UpdateCustomerPayload,
} from "@/api/customers/schema";
import type { PaginationMeta } from "@/api/shared/contracts";

const INVALID = "Resposta inválida do servidor de clientes.";

export interface CustomersResult {
  items: Customer[];
  pagination: PaginationMeta;
}

export async function fetchCustomers(
  params: ListCustomersParams,
): Promise<CustomersResult> {
  const response = await getStoreCustomersRequest(params);
  const parsed = CustomerSchema.array().safeParse(response.items);
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

export async function fetchCustomerFilterOptions(
  idStore: string,
): Promise<CustomerFilterOptions> {
  const parsed = CustomerFilterOptionsSchema.safeParse(
    await getStoreCustomerFilterOptionsRequest(idStore),
  );
  if (!parsed.success) return { names: [], creators: [] };
  return parsed.data;
}

export async function fetchCustomerById(
  idStore: string,
  idCustomer: string,
): Promise<Customer> {
  const parsed = CustomerSchema.safeParse(
    await getCustomerByIdRequest(idStore, idCustomer),
  );
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function createCustomer(
  payload: CreateCustomerPayload,
): Promise<Customer> {
  const body = CreateCustomerPayloadSchema.parse(payload);
  const parsed = CustomerSchema.safeParse(await createCustomerRequest(body));
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export async function updateCustomer(
  payload: UpdateCustomerPayload,
): Promise<Customer> {
  const body = UpdateCustomerPayloadSchema.parse(payload);
  const parsed = CustomerSchema.safeParse(await updateCustomerRequest(body));
  if (!parsed.success) throw new Error(INVALID);
  return parsed.data;
}

export type {
  Customer,
  CustomerFilterOptions,
  CustomerUserOption,
} from "@/api/customers/schema";
