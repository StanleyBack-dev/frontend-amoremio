import { apiHttp } from "../../shared/http-client";

export async function logout(): Promise<void> {
  await apiHttp.post("/auth/logout");
}
