import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { AuthMessageResponse } from "../schema";

export async function completeOnboardingTour(): Promise<AuthMessageResponse> {
  try {
    const response = await apiHttp.post<AuthMessageResponse>(
      "/auth/complete-onboarding-tour",
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível salvar a conclusão do tour."),
    );
  }
}
