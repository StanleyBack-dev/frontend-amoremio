import { HttpError } from "./http-error.js";

export function buildErrorResponse(error) {
  const httpError = error instanceof HttpError ? error : null;
  const statusCode = httpError?.statusCode ?? 500;
  const message = error?.message || "Unknown error";

  return {
    statusCode,
    body: {
      success: false,
      message,
      error: message,
      code: httpError?.code ?? null,
      details: httpError?.details ?? null,
      statusCode,
    },
  };
}
