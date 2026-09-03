import { z } from "zod";
import type { ListQueryParams, PaginatedResponse } from "../shared/contracts";

export const PageAccessKeySchema = z.enum([
  "DASHBOARD",
  "DEBTS",
  "DEBTS_STATEMENT",
  "INCOMES",
  "PAYMENTS",
  "INCOME_RECEIPTS",
  "CREDIT_CARDS",
  "ADMIN",
]);
export const UserGroupSchema = z.enum(["USER", "ADMIN", "ADMIN_MASTER"]);

export const UserSchema = z.object({
  idUsers: z.string(),
  name: z.string(),
  email: z.string(),
  // Nullable, not just optional: a user with no auth credentials row (e.g.
  // a referral-only placeholder that never logs in) genuinely has no
  // username — the backend sends `null` for it, not just omits the field.
  username: z.string().nullable().optional(),
  group: UserGroupSchema,
  urlAvatar: z.string().nullable().optional(),
  status: z.boolean(),
  mustChangePassword: z.boolean().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
  failedLoginAttempts: z.number().nullable().optional(),
  lockedUntil: z.string().nullable().optional(),
  inactivatedAt: z.string().nullable().optional(),
  deletionRequestedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const CreateUserPayloadSchema = z.object({
  name: z.string(),
  email: z.string(),
  username: z.string(),
  group: UserGroupSchema,
  urlAvatar: z.string().optional(),
  pagePermissions: z.array(PageAccessKeySchema).optional(),
});

export const UpdateUserPayloadSchema = z.object({
  idUsers: z.string(),
  group: UserGroupSchema,
  status: z.boolean(),
  pagePermissions: z.array(PageAccessKeySchema).optional(),
  useGroupDefaults: z.boolean().optional(),
});

export const CreateUserResponseSchema = UserSchema;
export const UpdateMyProfileResponseSchema = z.object({
  idUsers: z.string(),
  name: z.string(),
  email: z.string(),
  urlAvatar: z.string().nullable().optional(),
  status: z.boolean(),
  updatedAt: z.string(),
});
export const AdminUpdateUserAccessResponseSchema = z.object({
  idUsers: z.string(),
  group: UserGroupSchema,
  status: z.boolean(),
  inactivatedAt: z.string().nullable().optional(),
  updatedAt: z.string(),
});
export const UnlockUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const UserFilterOptionSchema = z.object({
  idUsers: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string().nullable().optional(),
});

export const UserPagePermissionsResponseSchema = z.object({
  idUsers: z.string().optional(),
  group: UserGroupSchema.optional(),
  effectivePermissions: z.array(PageAccessKeySchema).default([]),
  defaultPermissions: z.array(PageAccessKeySchema).default([]),
  useGroupDefaults: z.boolean().optional(),
});

export type PageAccessKey = z.infer<typeof PageAccessKeySchema>;
export type UserGroup = z.infer<typeof UserGroupSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;
export type UpdateUserPayload = z.infer<typeof UpdateUserPayloadSchema>;
export type UserPagePermissionsResponse = z.infer<
  typeof UserPagePermissionsResponseSchema
>;
export type UserFilterOption = z.infer<typeof UserFilterOptionSchema>;
export type UsersResponse = PaginatedResponse<User>;

export interface UserListQueryParams extends ListQueryParams {
  name?: string;
  email?: string;
  username?: string;
  group?: UserGroup;
  status?: boolean;
}
