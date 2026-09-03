import { z } from "zod";
import {
  LOGIN_IDENTIFIER_MAX_LENGTH,
  LOGIN_IDENTIFIER_MIN_LENGTH,
  LOGIN_PASSWORD_MAX_LENGTH,
  LOGIN_PASSWORD_MIN_LENGTH,
} from "./constants";
import { authValidationMessages } from "./messages";

const identifierSchema = z
  .string()
  .trim()
  .min(LOGIN_IDENTIFIER_MIN_LENGTH, authValidationMessages.identifierMin)
  .max(LOGIN_IDENTIFIER_MAX_LENGTH, authValidationMessages.identifierMax);

const passwordSchema = z
  .string()
  .min(LOGIN_PASSWORD_MIN_LENGTH, authValidationMessages.passwordMin)
  .max(LOGIN_PASSWORD_MAX_LENGTH, authValidationMessages.passwordMax);

export const loginFormSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const emptyLoginFormValues: LoginFormValues = {
  identifier: "",
  password: "",
  rememberMe: false,
};
