import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  CREATE_PRODUCT_MUTATION,
  GET_PRODUCT_BY_ID_QUERY,
  GET_PRODUCT_FILTER_OPTIONS_QUERY,
  GET_STORE_PRODUCTS_QUERY,
  UPDATE_PRODUCT_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listProducts(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_PRODUCTS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getStoreProducts, "Invalid products list response.");
}

export async function listProductFilterOptions(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_PRODUCT_FILTER_OPTIONS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getStoreProductFilterOptions,
    "Invalid product filter options response.",
  );
}

export async function getProductById(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_PRODUCT_BY_ID_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getProductById, "Product not found.");
}

export async function createProduct(input, authContext, requestId) {
  const data = await executeGraphql({
    query: CREATE_PRODUCT_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.createProduct?.data,
    "Invalid create product response.",
  );
}

export async function updateProduct(input, authContext, requestId) {
  const data = await executeGraphql({
    query: UPDATE_PRODUCT_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.updateProduct?.data,
    "Invalid update product response.",
  );
}
