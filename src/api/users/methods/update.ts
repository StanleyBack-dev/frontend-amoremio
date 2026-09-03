import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { UpdateUserPayload } from "../schema";

interface AdminUpdateUserAccessResult {
  idUsers: string;
  group: string;
  status: boolean;
  inactivatedAt?: string | null;
  updatedAt: string;
}

export async function updateUser(
  idUsers: string,
  payload: Omit<UpdateUserPayload, "idUsers">,
): Promise<AdminUpdateUserAccessResult> {
  try {
    const response = await apiHttp.patch<AdminUpdateUserAccessResult>(
      `/users/${idUsers}`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar usuário."),
    );
  }
}
