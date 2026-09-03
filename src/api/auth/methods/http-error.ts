export class AuthApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
  }
}

export function toAuthApiError(error: unknown, fallback: string): AuthApiError {
  if (error instanceof Error && error.message) {
    return new AuthApiError(error.message);
  }

  return new AuthApiError(fallback);
}
