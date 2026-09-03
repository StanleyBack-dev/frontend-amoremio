import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  ADD_STORE_MEMBER_MUTATION,
  CREATE_STORE_MUTATION,
  GET_MY_STORES_QUERY,
  GET_STORE_BY_ID_QUERY,
  GET_STORE_MEMBERS_QUERY,
  REMOVE_STORE_MEMBER_MUTATION,
  UPDATE_STORE_MEMBER_ROLE_MUTATION,
  UPDATE_STORE_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (value === undefined || value === null) {
    throw new HttpError(502, message);
  }

  return value;
}

export async function listMyStores(authContext, requestId) {
  const data = await executeGraphql({
    query: GET_MY_STORES_QUERY,
    variables: {},
    requestId,
    ...authContext,
  });

  return requireData(data.getMyStores, "Invalid stores list response.");
}

export async function getStoreById(idStore, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_BY_ID_QUERY,
    variables: { input: { idStore } },
    requestId,
    ...authContext,
  });

  return requireData(data.getStoreById, "Store not found.");
}

export async function listStoreMembers(idStore, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_STORE_MEMBERS_QUERY,
    variables: { input: { idStore } },
    requestId,
    ...authContext,
  });

  return requireData(data.getStoreMembers, "Invalid store members response.");
}

export async function createStore(input, authContext, requestId) {
  const data = await executeGraphql({
    query: CREATE_STORE_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(data.createStore?.data, "Invalid create store response.");
}

export async function updateStore(input, authContext, requestId) {
  const data = await executeGraphql({
    query: UPDATE_STORE_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(data.updateStore?.data, "Invalid update store response.");
}

export async function addStoreMember(input, authContext, requestId) {
  const data = await executeGraphql({
    query: ADD_STORE_MEMBER_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(data.addStoreMember, "Invalid add member response.");
}

export async function updateStoreMemberRole(input, authContext, requestId) {
  const data = await executeGraphql({
    query: UPDATE_STORE_MEMBER_ROLE_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(
    data.updateStoreMemberRole,
    "Invalid update member role response.",
  );
}

export async function removeStoreMember(input, authContext, requestId) {
  const data = await executeGraphql({
    query: REMOVE_STORE_MEMBER_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(data.removeStoreMember, "Invalid remove member response.");
}
