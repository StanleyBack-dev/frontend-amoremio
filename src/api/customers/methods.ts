import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  Customer,
  CustomerFilterOptions,
  CustomersResponse,
  CreateCustomerPayload,
  ListCustomersParams,
  UpdateCustomerPayload,
} from "./schema";

export async function getStoreCustomers(
  params: ListCustomersParams,
): Promise<CustomersResponse> {
  try {
    const response = await apiHttp.get<CustomersResponse>("/customers", {
      params,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível listar os clientes."),
    );
  }
}

export async function getStoreCustomerFilterOptions(
  idStore: string,
): Promise<CustomerFilterOptions> {
  try {
    const response = await apiHttp.get<CustomerFilterOptions>(
      "/customers/filter-options",
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar os filtros."),
    );
  }
}

export async function getCustomerById(
  idStore: string,
  idCustomer: string,
): Promise<Customer> {
  try {
    const response = await apiHttp.get<Customer>(`/customers/${idCustomer}`, {
      params: { idStore },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar o cliente."),
    );
  }
}

export async function createCustomer(
  payload: CreateCustomerPayload,
): Promise<Customer> {
  try {
    const response = await apiHttp.post<Customer>("/customers", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível criar o cliente."),
    );
  }
}

export async function updateCustomer(
  payload: UpdateCustomerPayload,
): Promise<Customer> {
  try {
    const { idCustomer, ...body } = payload;
    const response = await apiHttp.patch<Customer>(
      `/customers/${idCustomer}`,
      body,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar o cliente."),
    );
  }
}
