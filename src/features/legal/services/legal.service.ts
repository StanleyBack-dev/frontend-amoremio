import { acceptTermsOfUse } from "../../../api/legal/methods/acceptTermsOfUse";
import { getMyTermsAcceptanceStatus } from "../../../api/legal/methods/getMyTermsAcceptanceStatus";
import {
  TermsAcceptanceStatusSchema,
  type TermsAcceptanceStatus,
} from "../../../api/legal/schema";

export async function requestAcceptTermsOfUse(): Promise<void> {
  await acceptTermsOfUse();
}

export async function fetchMyTermsAcceptanceStatus(): Promise<TermsAcceptanceStatus> {
  const response = await getMyTermsAcceptanceStatus();
  const parsed = TermsAcceptanceStatusSchema.safeParse(response);

  if (!parsed.success) {
    throw new Error(
      "Não foi possível interpretar o status de aceite dos termos.",
    );
  }

  return parsed.data;
}
