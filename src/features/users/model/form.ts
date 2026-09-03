import { z } from "zod";
import { PageAccessKeySchema, type UserGroup } from "../../../api/users/schema";
import {
  USER_EMAIL_MAX_LENGTH,
  USER_EMAIL_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  USER_URL_AVATAR_MAX_LENGTH,
  USER_USERNAME_MAX_LENGTH,
  USER_USERNAME_MIN_LENGTH,
} from "./constants";
import { userUiCopy, userValidationMessages } from "./messages";

export const userGroupOptions = ["USER", "ADMIN", "ADMIN_MASTER"] as const;

export const userGroupSelectOptions: Array<{
  value: UserGroup;
  label: string;
}> = [
  { value: "USER", label: userUiCopy.form.options.groupUser },
  { value: "ADMIN", label: userUiCopy.form.options.groupAdmin },
  { value: "ADMIN_MASTER", label: userUiCopy.form.options.groupAdminMaster },
];

const nameSchema = z
  .string()
  .trim()
  .min(USER_NAME_MIN_LENGTH, userValidationMessages.nameRequired)
  .max(USER_NAME_MAX_LENGTH, userValidationMessages.nameMax);

const emailSchema = z
  .string()
  .trim()
  .min(USER_EMAIL_MIN_LENGTH, userValidationMessages.emailMin)
  .max(USER_EMAIL_MAX_LENGTH, userValidationMessages.emailMax)
  .email(userValidationMessages.emailInvalid);

const usernameSchema = z
  .string()
  .trim()
  .min(USER_USERNAME_MIN_LENGTH, userValidationMessages.usernameMin)
  .max(USER_USERNAME_MAX_LENGTH, userValidationMessages.usernameMax)
  .regex(/^[a-zA-Z0-9._-]+$/, userValidationMessages.usernamePattern);

const urlAvatarSchema = z
  .string()
  .trim()
  .max(USER_URL_AVATAR_MAX_LENGTH, userValidationMessages.urlAvatarMax)
  .url(userValidationMessages.urlAvatarInvalid)
  .optional()
  .or(z.literal(""));

export const createUserFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  username: usernameSchema,
  group: z.enum(userGroupOptions),
  urlAvatar: urlAvatarSchema,
  status: z.boolean(),
  pagePermissions: z.array(PageAccessKeySchema).default([]),
  useGroupDefaults: z.boolean().default(true),
});

export const updateUserFormSchema = z.object({
  name: nameSchema.optional().or(z.literal("")),
  email: emailSchema.optional().or(z.literal("")),
  username: usernameSchema.optional().or(z.literal("")),
  group: z.enum(userGroupOptions),
  urlAvatar: urlAvatarSchema.optional().or(z.literal("")),
  status: z.boolean(),
  pagePermissions: z.array(PageAccessKeySchema).default([]),
  useGroupDefaults: z.boolean().default(true),
});

export type UserFormValues = z.infer<typeof createUserFormSchema> & {
  createdAt: string;
};

export const emptyUserFormValues: UserFormValues = {
  name: "",
  email: "",
  username: "",
  group: "USER",
  urlAvatar: "",
  status: true,
  pagePermissions: [],
  useGroupDefaults: true,
  createdAt: "",
};
