import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { UserFilterOption } from "../schema";

export async function getUserFilterOptions(): Promise<UserFilterOption[]> {
  try {
    const response = await apiHttp.get<UserFilterOption[]>(
      "/users/filter-options",
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar opções de filtro."),
    );
  }
}
