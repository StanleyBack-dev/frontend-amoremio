import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  CREATE_SUPPLIER_MUTATION,
  GET_STORE_SUPPLIERS_QUERY,
  GET_SUPPLIER_BY_ID_QUERY,
  GET_SUPPLIER_FILTER_OPTIONS_QUERY,
  UPDATE_SUPPLIER_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listSuppliers(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_SUPPLIERS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getStoreSuppliers, "Invalid suppliers list response.");
}

export async function listSupplierFilterOptions(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_SUPPLIER_FILTER_OPTIONS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getStoreSupplierFilterOptions,
    "Invalid supplier filter options response.",
  );
}

export async function getSupplierById(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_SUPPLIER_BY_ID_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getSupplierById, "Supplier not found.");
}

export async function createSupplier(input, authContext, requestId) {
  const data = await executeGraphql({
    query: CREATE_SUPPLIER_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.createSupplier?.data,
    "Invalid create supplier response.",
  );
}

export async function updateSupplier(input, authContext, requestId) {
  const data = await executeGraphql({
    query: UPDATE_SUPPLIER_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.updateSupplier?.data,
    "Invalid update supplier response.",
  );
}
