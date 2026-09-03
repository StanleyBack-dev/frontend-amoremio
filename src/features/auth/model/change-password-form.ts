import { z } from "zod";
import {
  LOGIN_PASSWORD_MAX_LENGTH,
  LOGIN_PASSWORD_MIN_LENGTH,
} from "./constants";

export const changePasswordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(
        LOGIN_PASSWORD_MIN_LENGTH,
        "A senha atual deve ter no mínimo 8 caracteres",
      )
      .max(LOGIN_PASSWORD_MAX_LENGTH, "Senha atual muito longa"),
    newPassword: z
      .string()
      .min(
        LOGIN_PASSWORD_MIN_LENGTH,
        "A nova senha deve ter no mínimo 8 caracteres",
      )
      .max(LOGIN_PASSWORD_MAX_LENGTH, "Nova senha muito longa"),
    confirmNewPassword: z
      .string()
      .min(LOGIN_PASSWORD_MIN_LENGTH, "Confirme a nova senha"),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "As senhas não conferem",
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    path: ["newPassword"],
    message: "A nova senha deve ser diferente da senha atual",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export const emptyChangePasswordFormValues: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};
