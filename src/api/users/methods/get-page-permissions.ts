import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { UserPagePermissionsResponse } from "../schema";

export async function getUserPagePermissions(
  idUsers: string,
): Promise<UserPagePermissionsResponse> {
  try {
    const response = await apiHttp.get<UserPagePermissionsResponse>(
      `/users/${idUsers}/page-permissions`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar permissões."),
    );
  }
}
