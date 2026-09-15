import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  GET_UNMAPPED_CHANNEL_PRODUCTS_QUERY,
  MAP_CHANNEL_PRODUCT_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listUnmappedChannelProducts(
  input,
  authContext,
  requestId,
) {
  const data = await executeGraphql({
    query: GET_UNMAPPED_CHANNEL_PRODUCTS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getUnmappedChannelProducts,
    "Invalid unmapped channel products response.",
  );
}

export async function mapChannelProduct(input, authContext, requestId) {
  const data = await executeGraphql({
    query: MAP_CHANNEL_PRODUCT_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.mapChannelProduct?.data,
    "Invalid map channel product response.",
  );
}
