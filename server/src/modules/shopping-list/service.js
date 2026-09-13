import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  ADD_SHOPPING_LIST_ITEM_MUTATION,
  ADD_SHOPPING_LIST_ITEMS_MUTATION,
  CANCEL_SHOPPING_LIST_MUTATION,
  CONVERT_SHOPPING_LIST_TO_PURCHASE_MUTATION,
  CREATE_SHOPPING_LIST_MUTATION,
  GET_SHOPPING_LIST_BY_ID_QUERY,
  GET_SHOPPING_LIST_BY_PURCHASE_ID_QUERY,
  GET_STORE_SHOPPING_LISTS_QUERY,
  REMOVE_SHOPPING_LIST_ITEM_MUTATION,
  UPDATE_SHOPPING_LIST_ITEM_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listShoppingLists(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_SHOPPING_LISTS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getStoreShoppingLists,
    "Invalid shopping lists response.",
  );
}

export async function getShoppingListById(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_SHOPPING_LIST_BY_ID_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getShoppingListById, "Shopping list not found.");
}

// Unlike the other reads, `null` here is a valid, expected result (most
// purchases have no linked list) — never coerced into a 502 via requireData.
export async function getShoppingListByPurchaseId(
  input,
  authContext,
  requestId,
) {
  const data = await executeGraphql({
    query: GET_SHOPPING_LIST_BY_PURCHASE_ID_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return data.getShoppingListByPurchaseId ?? null;
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

export const createShoppingList = (input, ctx, rid) =>
  runMutation(
    CREATE_SHOPPING_LIST_MUTATION,
    "createShoppingList",
    input,
    ctx,
    rid,
  );
export const addShoppingListItem = (input, ctx, rid) =>
  runMutation(
    ADD_SHOPPING_LIST_ITEM_MUTATION,
    "addShoppingListItem",
    input,
    ctx,
    rid,
  );
export const addShoppingListItems = (input, ctx, rid) =>
  runMutation(
    ADD_SHOPPING_LIST_ITEMS_MUTATION,
    "addShoppingListItems",
    input,
    ctx,
    rid,
  );
export const updateShoppingListItem = (input, ctx, rid) =>
  runMutation(
    UPDATE_SHOPPING_LIST_ITEM_MUTATION,
    "updateShoppingListItem",
    input,
    ctx,
    rid,
  );
export const removeShoppingListItem = (input, ctx, rid) =>
  runMutation(
    REMOVE_SHOPPING_LIST_ITEM_MUTATION,
    "removeShoppingListItem",
    input,
    ctx,
    rid,
  );
export const cancelShoppingList = (input, ctx, rid) =>
  runMutation(
    CANCEL_SHOPPING_LIST_MUTATION,
    "cancelShoppingList",
    input,
    ctx,
    rid,
  );
export const convertShoppingListToPurchase = (input, ctx, rid) =>
  runMutation(
    CONVERT_SHOPPING_LIST_TO_PURCHASE_MUTATION,
    "convertShoppingListToPurchase",
    input,
    ctx,
    rid,
  );
