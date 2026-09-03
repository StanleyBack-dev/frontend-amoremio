import { apiHttp, getApiErrorMessage } from "../../shared/http-client";
import type { CreateUserPayload, User } from "../schema";

export async function createUser(payload: CreateUserPayload): Promise<User> {
  try {
    const response = await apiHttp.post<User>("/users", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível criar usuário."),
    );
  }
}
