import { apiHttp, getApiErrorMessage } from "@/api/shared/http-client";
import {
  FinanceDashboardSchema,
  type FinanceDashboard,
} from "@/api/dashboard/schema";

export async function fetchFinanceDashboard(
  idStore: string,
  period?: { from: Date; to: Date },
): Promise<FinanceDashboard> {
  let raw: unknown;
  try {
    const response = await apiHttp.get("/dashboard", {
      params: {
        idStore,
        from: period?.from.toISOString(),
        to: period?.to.toISOString(),
      },
    });
    raw = response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Não foi possível carregar o dashboard."),
    );
  }

  const parsed = FinanceDashboardSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Resposta inválida do dashboard.");
  }
  return parsed.data;
}
