import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  CREATE_BRAND_MUTATION,
  GET_BRAND_BY_ID_QUERY,
  GET_BRAND_FILTER_OPTIONS_QUERY,
  GET_STORE_BRANDS_QUERY,
  UPDATE_BRAND_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listBrands(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_BRANDS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getStoreBrands, "Invalid brands list response.");
}

export async function listBrandFilterOptions(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_BRAND_FILTER_OPTIONS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getStoreBrandFilterOptions,
    "Invalid brand filter options response.",
  );
}

export async function getBrandById(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_BRAND_BY_ID_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getBrandById, "Brand not found.");
}

export async function createBrand(input, authContext, requestId) {
  const data = await executeGraphql({
    query: CREATE_BRAND_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.createBrand?.data, "Invalid create brand response.");
}

export async function updateBrand(input, authContext, requestId) {
  const data = await executeGraphql({
    query: UPDATE_BRAND_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.updateBrand?.data, "Invalid update brand response.");
}
