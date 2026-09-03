import { apiHttp } from "../../shared/http-client";
import type { AuthSessionResponse } from "../schema";

export async function refreshAuthSession(): Promise<AuthSessionResponse> {
  const response = await apiHttp.get<AuthSessionResponse>("/auth/session");
  return response.data;
}
