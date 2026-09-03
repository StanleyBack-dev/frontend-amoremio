import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  Brand,
  BrandFilterOptions,
  BrandsResponse,
  CreateBrandPayload,
  ListBrandsParams,
  UpdateBrandPayload,
} from "./schema";

export async function getStoreBrands(
  params: ListBrandsParams,
): Promise<BrandsResponse> {
  try {
    const response = await apiHttp.get<BrandsResponse>("/brands", { params });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível listar as marcas."),
    );
  }
}

export async function getStoreBrandFilterOptions(
  idStore: string,
): Promise<BrandFilterOptions> {
  try {
    const response = await apiHttp.get<BrandFilterOptions>(
      "/brands/filter-options",
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar os filtros."),
    );
  }
}

export async function getBrandById(
  idStore: string,
  idBrand: string,
): Promise<Brand> {
  try {
    const response = await apiHttp.get<Brand>(`/brands/${idBrand}`, {
      params: { idStore },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar a marca."),
    );
  }
}

export async function createBrand(payload: CreateBrandPayload): Promise<Brand> {
  try {
    const response = await apiHttp.post<Brand>("/brands", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível criar a marca."),
    );
  }
}

export async function updateBrand(payload: UpdateBrandPayload): Promise<Brand> {
  try {
    const { idBrand, ...body } = payload;
    const response = await apiHttp.patch<Brand>(`/brands/${idBrand}`, body);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar a marca."),
    );
  }
}
