import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  CREATE_CUSTOMER_MUTATION,
  GET_CUSTOMER_BY_ID_QUERY,
  GET_CUSTOMER_FILTER_OPTIONS_QUERY,
  GET_STORE_CUSTOMERS_QUERY,
  UPDATE_CUSTOMER_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }
  return value;
}

export async function listCustomers(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_CUSTOMERS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getStoreCustomers,
    "Invalid customers list response.",
  );
}

export async function listCustomerFilterOptions(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_CUSTOMER_FILTER_OPTIONS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.getStoreCustomerFilterOptions,
    "Invalid customer filter options response.",
  );
}

export async function getCustomerById(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_CUSTOMER_BY_ID_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(data.getCustomerById, "Customer not found.");
}

export async function createCustomer(input, authContext, requestId) {
  const data = await executeGraphql({
    query: CREATE_CUSTOMER_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.createCustomer?.data,
    "Invalid create customer response.",
  );
}

export async function updateCustomer(input, authContext, requestId) {
  const data = await executeGraphql({
    query: UPDATE_CUSTOMER_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });
  return requireData(
    data.updateCustomer?.data,
    "Invalid update customer response.",
  );
}
