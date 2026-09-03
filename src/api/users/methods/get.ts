import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { UserListQueryParams, UsersResponse } from "../schema";

export async function getUsers(
  params: UserListQueryParams = {},
): Promise<UsersResponse> {
  try {
    const response = await apiHttp.get<UsersResponse>("/users", { params });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível listar usuários."),
    );
  }
}
