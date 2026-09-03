import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { AuthMessageResponse } from "../schema";

export async function resetPasswordWithRecovery(payload: {
  recoveryToken: string;
  newPassword: string;
}): Promise<AuthMessageResponse> {
  try {
    const response = await apiHttp.post<AuthMessageResponse>(
      "/auth/password-recovery/reset",
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível redefinir senha."),
    );
  }
}
