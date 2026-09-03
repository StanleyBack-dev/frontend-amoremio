import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  ACCEPT_TERMS_OF_USE_MUTATION,
  MY_TERMS_ACCEPTANCE_STATUS_QUERY,
} from "./queries.js";

function requireData(value, message) {
  if (!value) {
    throw new HttpError(502, message);
  }

  return value;
}

export async function getMyTermsAcceptanceStatus(authContext, requestId) {
  const data = await executeGraphql({
    query: MY_TERMS_ACCEPTANCE_STATUS_QUERY,
    requestId,
    ...authContext,
  });

  return requireData(
    data.myTermsAcceptanceStatus,
    "Invalid terms acceptance status response.",
  );
}

export async function acceptTermsOfUse(authContext, requestId) {
  const data = await executeGraphql({
    query: ACCEPT_TERMS_OF_USE_MUTATION,
    requestId,
    ...authContext,
  });

  return requireData(
    data.acceptTermsOfUse,
    "Invalid accept terms of use response.",
  );
}
