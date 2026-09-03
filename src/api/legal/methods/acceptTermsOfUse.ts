import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { AuthMessageResponse } from "../../auth/schema";

export async function acceptTermsOfUse(): Promise<AuthMessageResponse> {
  try {
    const response = await apiHttp.post<AuthMessageResponse>(
      "/legal/accept-terms",
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Não foi possível registrar o aceite dos termos.",
      ),
    );
  }
}
