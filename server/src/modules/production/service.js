import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  ADD_RECIPE_ITEM_MUTATION,
  ADD_RECIPE_ITEMS_MUTATION,
  CANCEL_PRODUCTION_ORDER_MUTATION,
  COMPLETE_PRODUCTION_ORDER_MUTATION,
  CREATE_PRODUCTION_ORDER_MUTATION,
  CREATE_RECIPE_MUTATION,
  GET_PRODUCTION_ORDER_BY_ID_QUERY,
  GET_PRODUCTION_ORDER_FILTER_OPTIONS_QUERY,
  GET_RECIPE_BY_ID_QUERY,
  GET_STORE_PRODUCTION_ORDERS_QUERY,
  GET_STORE_RECIPES_QUERY,
  REMOVE_RECIPE_ITEM_MUTATION,
  UPDATE_PRODUCTION_ORDER_MUTATION,
  UPDATE_RECIPE_ITEM_MUTATION,
  UPDATE_RECIPE_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

async function runQuery(query, key, input, authContext, requestId, message) {
  const data = await executeGraphql({
    query,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data[key], message);
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

export const listRecipes = (input, ctx, rid) =>
  runQuery(
    GET_STORE_RECIPES_QUERY,
    "getStoreRecipes",
    input,
    ctx,
    rid,
    "Invalid recipes list response.",
  );
export const getRecipeById = (input, ctx, rid) =>
  runQuery(
    GET_RECIPE_BY_ID_QUERY,
    "getRecipeById",
    input,
    ctx,
    rid,
    "Recipe not found.",
  );
export const listProductionOrders = (input, ctx, rid) =>
  runQuery(
    GET_STORE_PRODUCTION_ORDERS_QUERY,
    "getStoreProductionOrders",
    input,
    ctx,
    rid,
    "Invalid production orders list response.",
  );
export const listProductionOrderFilterOptions = (input, ctx, rid) =>
  runQuery(
    GET_PRODUCTION_ORDER_FILTER_OPTIONS_QUERY,
    "getStoreProductionOrderFilterOptions",
    input,
    ctx,
    rid,
    "Invalid production order filter options response.",
  );
export const getProductionOrderById = (input, ctx, rid) =>
  runQuery(
    GET_PRODUCTION_ORDER_BY_ID_QUERY,
    "getProductionOrderById",
    input,
    ctx,
    rid,
    "Production order not found.",
  );

export const createRecipe = (input, ctx, rid) =>
  runMutation(CREATE_RECIPE_MUTATION, "createRecipe", input, ctx, rid);
export const updateRecipe = (input, ctx, rid) =>
  runMutation(UPDATE_RECIPE_MUTATION, "updateRecipe", input, ctx, rid);
export const addRecipeItem = (input, ctx, rid) =>
  runMutation(ADD_RECIPE_ITEM_MUTATION, "addRecipeItem", input, ctx, rid);
export const addRecipeItems = (input, ctx, rid) =>
  runMutation(ADD_RECIPE_ITEMS_MUTATION, "addRecipeItems", input, ctx, rid);
export const updateRecipeItem = (input, ctx, rid) =>
  runMutation(UPDATE_RECIPE_ITEM_MUTATION, "updateRecipeItem", input, ctx, rid);
export const removeRecipeItem = (input, ctx, rid) =>
  runMutation(REMOVE_RECIPE_ITEM_MUTATION, "removeRecipeItem", input, ctx, rid);

export const createProductionOrder = (input, ctx, rid) =>
  runMutation(
    CREATE_PRODUCTION_ORDER_MUTATION,
    "createProductionOrder",
    input,
    ctx,
    rid,
  );
export const updateProductionOrder = (input, ctx, rid) =>
  runMutation(
    UPDATE_PRODUCTION_ORDER_MUTATION,
    "updateProductionOrder",
    input,
    ctx,
    rid,
  );
export const completeProductionOrder = (input, ctx, rid) =>
  runMutation(
    COMPLETE_PRODUCTION_ORDER_MUTATION,
    "completeProductionOrder",
    input,
    ctx,
    rid,
  );
export const cancelProductionOrder = (input, ctx, rid) =>
  runMutation(
    CANCEL_PRODUCTION_ORDER_MUTATION,
    "cancelProductionOrder",
    input,
    ctx,
    rid,
  );
