import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  ADD_SALES_ORDER_ITEM_MUTATION,
  CANCEL_SALES_ORDER_MUTATION,
  CONFIRM_SALES_ORDER_MUTATION,
  CREATE_SALES_ORDER_MUTATION,
  GET_SALES_ORDER_BY_ID_QUERY,
  GET_SALES_ORDER_FILTER_OPTIONS_QUERY,
  GET_STORE_SALES_ORDERS_QUERY,
  REMOVE_SALES_ORDER_ITEM_MUTATION,
  UPDATE_SALES_ORDER_HEADER_MUTATION,
  UPDATE_SALES_ORDER_ITEM_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listSalesOrders(input, ctx, rid) {
  const data = await executeGraphql({
    query: GET_STORE_SALES_ORDERS_QUERY,
    variables: { input },
    requestId: rid,
    ...ctx,
  });
  return requireData(data.getStoreSalesOrders, "Invalid sales list response.");
}

export async function getSalesOrderById(input, ctx, rid) {
  const data = await executeGraphql({
    query: GET_SALES_ORDER_BY_ID_QUERY,
    variables: { input },
    requestId: rid,
    ...ctx,
  });
  return requireData(data.getSalesOrderById, "Sales order not found.");
}

export async function listSalesOrderFilterOptions(input, ctx, rid) {
  const data = await executeGraphql({
    query: GET_SALES_ORDER_FILTER_OPTIONS_QUERY,
    variables: { input },
    requestId: rid,
    ...ctx,
  });
  return requireData(
    data.getStoreSalesOrderFilterOptions,
    "Invalid sales filter options response.",
  );
}

async function runMutation(query, key, input, ctx, rid) {
  const data = await executeGraphql({
    query,
    variables: { input },
    requestId: rid,
    ...ctx,
  });
  return requireData(data[key]?.data, `Invalid ${key} response.`);
}

export const createSalesOrder = (i, c, r) =>
  runMutation(CREATE_SALES_ORDER_MUTATION, "createSalesOrder", i, c, r);
export const updateSalesOrderHeader = (i, c, r) =>
  runMutation(UPDATE_SALES_ORDER_HEADER_MUTATION, "updateSalesOrderHeader", i, c, r);
export const addSalesOrderItem = (i, c, r) =>
  runMutation(ADD_SALES_ORDER_ITEM_MUTATION, "addSalesOrderItem", i, c, r);
export const updateSalesOrderItem = (i, c, r) =>
  runMutation(UPDATE_SALES_ORDER_ITEM_MUTATION, "updateSalesOrderItem", i, c, r);
export const removeSalesOrderItem = (i, c, r) =>
  runMutation(REMOVE_SALES_ORDER_ITEM_MUTATION, "removeSalesOrderItem", i, c, r);
export const confirmSalesOrder = (i, c, r) =>
  runMutation(CONFIRM_SALES_ORDER_MUTATION, "confirmSalesOrder", i, c, r);
export const cancelSalesOrder = (i, c, r) =>
  runMutation(CANCEL_SALES_ORDER_MUTATION, "cancelSalesOrder", i, c, r);
