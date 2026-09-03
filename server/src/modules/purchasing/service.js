import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  ADD_PURCHASE_ITEM_MUTATION,
  CANCEL_PURCHASE_MUTATION,
  CREATE_PURCHASE_DRAFT_MUTATION,
  FINALIZE_PURCHASE_MUTATION,
  GET_PURCHASE_BY_ID_QUERY,
  GET_PURCHASE_FILTER_OPTIONS_QUERY,
  GET_STORE_PURCHASES_QUERY,
  REMOVE_PURCHASE_ITEM_MUTATION,
  UPDATE_PURCHASE_HEADER_MUTATION,
  UPDATE_PURCHASE_ITEM_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listPurchases(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_PURCHASES_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getStorePurchases, "Invalid purchases list response.");
}

export async function listPurchaseFilterOptions(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_PURCHASE_FILTER_OPTIONS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getStorePurchaseFilterOptions,
    "Invalid purchase filter options response.",
  );
}

export async function getPurchaseById(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_PURCHASE_BY_ID_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getPurchaseById, "Purchase not found.");
}

async function runMutation(query, key, input, authContext, requestId) {
  const data = await executeGraphql({
    query,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data[key]?.data, `Invalid ${key} response.`);
}

export const createPurchaseDraft = (input, ctx, rid) =>
  runMutation(CREATE_PURCHASE_DRAFT_MUTATION, "createPurchaseDraft", input, ctx, rid);
export const updatePurchaseHeader = (input, ctx, rid) =>
  runMutation(UPDATE_PURCHASE_HEADER_MUTATION, "updatePurchaseHeader", input, ctx, rid);
export const addPurchaseItem = (input, ctx, rid) =>
  runMutation(ADD_PURCHASE_ITEM_MUTATION, "addPurchaseItem", input, ctx, rid);
export const updatePurchaseItem = (input, ctx, rid) =>
  runMutation(UPDATE_PURCHASE_ITEM_MUTATION, "updatePurchaseItem", input, ctx, rid);
export const removePurchaseItem = (input, ctx, rid) =>
  runMutation(REMOVE_PURCHASE_ITEM_MUTATION, "removePurchaseItem", input, ctx, rid);
export const finalizePurchase = (input, ctx, rid) =>
  runMutation(FINALIZE_PURCHASE_MUTATION, "finalizePurchase", input, ctx, rid);
export const cancelPurchase = (input, ctx, rid) =>
  runMutation(CANCEL_PURCHASE_MUTATION, "cancelPurchase", input, ctx, rid);
