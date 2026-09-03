import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  CreateSupplierPayload,
  ListSuppliersParams,
  Supplier,
  SupplierFilterOptions,
  SuppliersResponse,
  UpdateSupplierPayload,
} from "./schema";

export async function getStoreSuppliers(
  params: ListSuppliersParams,
): Promise<SuppliersResponse> {
  try {
    const response = await apiHttp.get<SuppliersResponse>("/suppliers", {
      params,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível listar os fornecedores."),
    );
  }
}

export async function getStoreSupplierFilterOptions(
  idStore: string,
): Promise<SupplierFilterOptions> {
  try {
    const response = await apiHttp.get<SupplierFilterOptions>(
      "/suppliers/filter-options",
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar os filtros."),
    );
  }
}

export async function getSupplierById(
  idStore: string,
  idSupplier: string,
): Promise<Supplier> {
  try {
    const response = await apiHttp.get<Supplier>(`/suppliers/${idSupplier}`, {
      params: { idStore },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar o fornecedor."),
    );
  }
}

export async function createSupplier(
  payload: CreateSupplierPayload,
): Promise<Supplier> {
  try {
    const response = await apiHttp.post<Supplier>("/suppliers", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível criar o fornecedor."),
    );
  }
}

export async function updateSupplier(
  payload: UpdateSupplierPayload,
): Promise<Supplier> {
  try {
    const { idSupplier, ...body } = payload;
    const response = await apiHttp.patch<Supplier>(
      `/suppliers/${idSupplier}`,
      body,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar o fornecedor."),
    );
  }
}
