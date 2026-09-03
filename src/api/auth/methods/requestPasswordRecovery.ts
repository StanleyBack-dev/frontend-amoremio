import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { AuthMessageResponse } from "../schema";

export async function requestPasswordRecovery(payload: {
  email: string;
}): Promise<AuthMessageResponse> {
  try {
    const response = await apiHttp.post<AuthMessageResponse>(
      "/auth/password-recovery/request",
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível solicitar recuperação."),
    );
  }
}
