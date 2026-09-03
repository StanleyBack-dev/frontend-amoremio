import { z } from "zod";

export const AuthUserSchema = z.object({
  idUsers: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string(),
  group: z.enum(["USER", "ADMIN", "ADMIN_MASTER"]),
  urlAvatar: z.string().nullable().optional(),
  status: z.boolean(),
});

export const AuthSessionResponseSchema = z.object({
  authenticated: z.boolean(),
  user: AuthUserSchema,
  mustChangePassword: z.boolean().optional(),
  onboardingTourCompleted: z.boolean().optional(),
  termsAccepted: z.boolean().optional(),
  isTermsReacceptance: z.boolean().optional(),
});

export const AuthMessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type AuthSessionResponse = z.infer<typeof AuthSessionResponseSchema>;
export type AuthMessageResponse = z.infer<typeof AuthMessageResponseSchema>;
