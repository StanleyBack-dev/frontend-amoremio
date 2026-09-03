import { z } from "zod";

export const TermsAcceptanceStatusSchema = z.object({
  accepted: z.boolean(),
  acceptedAt: z.string().nullable().optional(),
  termsVersion: z.string().nullable().optional(),
});

export type TermsAcceptanceStatus = z.infer<typeof TermsAcceptanceStatusSchema>;
