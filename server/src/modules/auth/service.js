import { HttpError } from "../../shared/http/http-error.js";
import { executeGraphql } from "../../shared/http/graphql-client.js";
import {
  CHANGE_PASSWORD_MUTATION,
  COMPLETE_ONBOARDING_TOUR_MUTATION,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  MY_PAGE_PERMISSIONS_QUERY,
  REFRESH_SESSION_QUERY,
  REQUEST_PASSWORD_RECOVERY_MUTATION,
  RESET_PASSWORD_RECOVERY_MUTATION,
  VERIFY_PASSWORD_RECOVERY_MUTATION,
} from "./queries.js";

function requireData(value, message) {
  if (!value) {
    throw new HttpError(502, message);
  }

  return value;
}

export async function login(input, authContext, requestId) {
  const result = await executeGraphql({
    query: LOGIN_MUTATION,
    variables: { input },
    requestId,
    captureResponseMeta: true,
    ...authContext,
  });

  return {
    session: requireData(result.data.login, "Invalid login response."),
    setCookie: result.responseHeaders?.setCookie ?? [],
  };
}

export async function refreshAuthSession(authContext, requestId) {
  const result = await executeGraphql({
    query: REFRESH_SESSION_QUERY,
    variables: {},
    requestId,
    captureResponseMeta: true,
    ...authContext,
  });

  return {
    session: requireData(
      result.data.refreshAuthSession,
      "Invalid session response.",
    ),
    setCookie: result.responseHeaders?.setCookie ?? [],
  };
}

export async function getMyPagePermissions(authContext, requestId) {
  const data = await executeGraphql({
    query: MY_PAGE_PERMISSIONS_QUERY,
    variables: {},
    requestId,
    ...authContext,
  });

  return requireData(
    data.getMyPagePermissions,
    "Invalid permissions response.",
  );
}

export async function logout(authContext, requestId) {
  const result = await executeGraphql({
    query: LOGOUT_MUTATION,
    variables: {},
    requestId,
    captureResponseMeta: true,
    ...authContext,
  });

  return {
    result: requireData(result.data.logout, "Invalid logout response."),
    setCookie: result.responseHeaders?.setCookie ?? [],
  };
}

export async function changeMyPassword(input, authContext, requestId) {
  const result = await executeGraphql({
    query: CHANGE_PASSWORD_MUTATION,
    variables: { input },
    requestId,
    captureResponseMeta: true,
    ...authContext,
  });

  return {
    result: requireData(
      result.data.changeMyPassword,
      "Invalid password response.",
    ),
    setCookie: result.responseHeaders?.setCookie ?? [],
  };
}

export async function completeOnboardingTour(authContext, requestId) {
  const result = await executeGraphql({
    query: COMPLETE_ONBOARDING_TOUR_MUTATION,
    variables: {},
    requestId,
    ...authContext,
  });

  return requireData(
    result.completeOnboardingTour,
    "Invalid onboarding tour response.",
  );
}

export async function requestPasswordRecovery(input, authContext, requestId) {
  const data = await executeGraphql({
    query: REQUEST_PASSWORD_RECOVERY_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(
    data.requestPasswordRecovery,
    "Invalid recovery request response.",
  );
}

export async function verifyPasswordRecoveryCode(
  input,
  authContext,
  requestId,
) {
  const data = await executeGraphql({
    query: VERIFY_PASSWORD_RECOVERY_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(
    data.verifyPasswordRecoveryCode,
    "Invalid recovery verification response.",
  );
}

export async function resetPasswordWithRecovery(input, authContext, requestId) {
  const data = await executeGraphql({
    query: RESET_PASSWORD_RECOVERY_MUTATION,
    variables: { input },
    requestId,
    ...authContext,
  });

  return requireData(
    data.resetPasswordWithRecovery,
    "Invalid recovery reset response.",
  );
}
