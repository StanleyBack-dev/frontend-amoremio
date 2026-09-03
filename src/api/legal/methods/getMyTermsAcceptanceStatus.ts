import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { TermsAcceptanceStatus } from "../schema";

export async function getMyTermsAcceptanceStatus(): Promise<TermsAcceptanceStatus> {
  try {
    const response = await apiHttp.get<TermsAcceptanceStatus>(
      "/legal/terms-status",
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Não foi possível verificar o status de aceite dos termos.",
      ),
    );
  }
}
