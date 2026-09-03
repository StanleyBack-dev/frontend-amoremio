import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  ADMIN_UPDATE_USER_ACCESS_MUTATION,
  CREATE_USER_MUTATION,
  GET_USERS_QUERY,
  GET_USER_FILTER_OPTIONS_QUERY,
  GET_USER_PAGE_PERMISSIONS_QUERY,
  ME_QUERY,
  UNLOCK_USER_CREDENTIAL_MUTATION,
  UPDATE_MY_PROFILE_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (!value) {
    throw new HttpError(502, message);
  }

  return value;
}

export async function getMyProfile(authContext, requestId) {
  const data = await executeGraphql({
    query: ME_QUERY,
    requestId,
    ...authContext,
  });

  return requireData(data.me, "Invalid profile response.");
}

export async function updateMyProfile(input, authContext, requestId) {
  const data = await executeGraphql({
    query: UPDATE_MY_PROFILE_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(data.updateUser?.data, "Invalid update profile response.");
}

export async function listUsers(input, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_USERS_QUERY,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(data.getUsers, "Invalid users list response.");
}

export async function createUser(input, authContext, requestId) {
  const data = await executeGraphql({
    query: CREATE_USER_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(data.createUser?.data, "Invalid create user response.");
}

export async function updateUser(idUsers, input, authContext, requestId) {
  const data = await executeGraphql({
    query: ADMIN_UPDATE_USER_ACCESS_MUTATION,
    variables: { input: { idUsers, ...input } },
    requestId,
    ...authContext,
  });

  return requireData(
    data.adminUpdateUserAccess?.data,
    "Invalid update user response.",
  );
}

export async function getUserFilterOptions(authContext, requestId) {
  const data = await executeGraphql({
    query: GET_USER_FILTER_OPTIONS_QUERY,
    requestId,
    ...authContext,
  });

  return data.getUserFilterOptions || [];
}

export async function getUserPagePermissions(idUsers, authContext, requestId) {
  const data = await executeGraphql({
    query: GET_USER_PAGE_PERMISSIONS_QUERY,
    variables: { input: { idUsers } },
    requestId,
    ...authContext,
  });

  return requireData(
    data.getUserPagePermissions,
    "Invalid user permissions response.",
  );
}

export async function unlockUser(idUsers, authContext, requestId) {
  const data = await executeGraphql({
    query: UNLOCK_USER_CREDENTIAL_MUTATION,
    variables: { input: { idUsers } },
    requestId,
    ...authContext,
  });

  return requireData(
    data.unlockUserCredential,
    "Invalid unlock user response.",
  );
}
