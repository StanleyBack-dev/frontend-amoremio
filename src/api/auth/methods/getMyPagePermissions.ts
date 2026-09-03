import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { PageAccessKey } from "../../users/schema";

export async function getMyPagePermissions(): Promise<{
  effectivePermissions: PageAccessKey[];
}> {
  try {
    const response = await apiHttp.get<{
      effectivePermissions: PageAccessKey[];
    }>("/auth/me/page-permissions");
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar permissões."),
    );
  }
}
