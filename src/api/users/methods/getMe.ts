import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { User } from "../schema";

export async function getMe(): Promise<User> {
  try {
    const response = await apiHttp.get<User>("/users/me");
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar seu perfil."),
    );
  }
}
