import { apiHttp, getApiErrorMessage } from "../../shared/http-client";

export async function verifyPasswordRecoveryCode(payload: {
  email: string;
  code: string;
}): Promise<{
  success: boolean;
  message?: string;
  data: { recoveryToken: string; expiresAt: string };
}> {
  try {
    const response = await apiHttp.post<{
      success: boolean;
      message?: string;
      data: { recoveryToken: string; expiresAt: string };
    }>("/auth/password-recovery/verify", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível validar código."),
    );
  }
}
