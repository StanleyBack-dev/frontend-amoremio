import { apiHttp, getApiErrorMessage } from "../../shared/http-client";

export async function unlockUser(idUsers: string) {
  try {
    const response = await apiHttp.post<{ success: boolean; message?: string }>(
      `/users/${idUsers}/unlock`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível desbloquear usuário."),
    );
  }
}
