import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { AuthMessageResponse } from "../schema";

export async function changeMyPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<AuthMessageResponse> {
  try {
    const response = await apiHttp.post<AuthMessageResponse>(
      "/auth/change-password",
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível alterar senha."),
    );
  }
}
