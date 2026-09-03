import { apiHttp, getApiErrorMessage } from "../shared/http-client";
import type {
  CreateProductPayload,
  ListProductsParams,
  Product,
  ProductFilterOptions,
  ProductsResponse,
  UpdateProductPayload,
} from "./schema";

export async function getStoreProducts(
  params: ListProductsParams,
): Promise<ProductsResponse> {
  try {
    const { kinds, ...rest } = params;
    const response = await apiHttp.get<ProductsResponse>("/products", {
      params: {
        ...rest,
        // Send as a single comma-separated value; the BFF splits it back.
        kinds: kinds && kinds.length > 0 ? kinds.join(",") : undefined,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível listar os produtos."),
    );
  }
}

export async function getStoreProductFilterOptions(
  idStore: string,
): Promise<ProductFilterOptions> {
  try {
    const response = await apiHttp.get<ProductFilterOptions>(
      "/products/filter-options",
      { params: { idStore } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar os filtros."),
    );
  }
}

export async function getProductById(
  idStore: string,
  idProduct: string,
): Promise<Product> {
  try {
    const response = await apiHttp.get<Product>(`/products/${idProduct}`, {
      params: { idStore },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar o produto."),
    );
  }
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<Product> {
  try {
    const response = await apiHttp.post<Product>("/products", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível criar o produto."),
    );
  }
}

export async function updateProduct(
  payload: UpdateProductPayload,
): Promise<Product> {
  try {
    const { idProduct, ...body } = payload;
    const response = await apiHttp.patch<Product>(
      `/products/${idProduct}`,
      body,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar o produto."),
    );
  }
}
