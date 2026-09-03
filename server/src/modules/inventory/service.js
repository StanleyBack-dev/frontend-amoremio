import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  ADJUST_STOCK_MUTATION,
  GET_STOCK_MOVEMENTS_QUERY,
  GET_STORE_STOCK_QUERY,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listStoreStock(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_STOCK_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getStoreStock, "Invalid store stock response.");
}

export async function listStockMovements(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STOCK_MOVEMENTS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getStockMovements,
    "Invalid stock movements response.",
  );
}

export async function adjustStock(input, authContext, requestId) {
  const data = await executeGraphql({
    query: ADJUST_STOCK_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.adjustStock, "Invalid adjust stock response.");
}
