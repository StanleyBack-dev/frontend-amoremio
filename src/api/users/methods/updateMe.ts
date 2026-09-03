import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { User } from "../schema";

export async function updateMyProfile(payload: {
  name?: string;
}): Promise<User> {
  try {
    const response = await apiHttp.patch<User>("/users/me", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível atualizar seu perfil."),
    );
  }
}
