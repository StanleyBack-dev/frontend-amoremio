import type {
  CreateUserPayload,
  PageAccessKey,
  UpdateUserPayload,
  User,
} from "../../../api/users/schema";
import { formatDateTimeDisplay } from "../../../utils/format";
import type { UserFormValues } from "./form";
import { getDefaultPagePermissionsByGroup } from "./page-permissions";

export function mapUserToFormValues(user: User): UserFormValues {
  return {
    name: user.name,
    email: user.email,
    username: user.username || "",
    group: user.group,
    urlAvatar: user.urlAvatar || "",
    status: user.status,
    pagePermissions: getDefaultPagePermissionsByGroup(user.group),
    useGroupDefaults: true,
    createdAt: formatDateTimeDisplay(user.createdAt),
  };
}

export function mapUserFormToCreateValidationInput(values: UserFormValues) {
  return {
    name: values.name,
    email: values.email,
    username: values.username,
    group: values.group,
    urlAvatar: values.urlAvatar,
    status: values.status,
    pagePermissions: values.pagePermissions,
    useGroupDefaults: values.useGroupDefaults,
  };
}

export function mapUserFormToUpdateValidationInput(values: UserFormValues) {
  return {
    group: values.group,
    status: values.status,
    pagePermissions: values.pagePermissions,
    useGroupDefaults: values.useGroupDefaults,
  };
}

export function mapUserFormToCreatePayload(
  values: UserFormValues,
): CreateUserPayload {
  const sanitizedPermissions = values.pagePermissions.filter(
    (value): value is PageAccessKey => typeof value === "string",
  );

  return {
    name: values.name,
    email: values.email,
    username: values.username,
    group: values.group,
    urlAvatar: values.urlAvatar || undefined,
    pagePermissions: values.useGroupDefaults ? undefined : sanitizedPermissions,
  };
}

export function mapUserFormToUpdatePayload(
  values: UserFormValues,
  idUsers?: string,
): UpdateUserPayload {
  const sanitizedPermissions = values.pagePermissions.filter(
    (value): value is PageAccessKey => typeof value === "string",
  );

  return {
    idUsers: idUsers || "",
    group: values.group,
    status: values.status,
    pagePermissions: values.useGroupDefaults ? undefined : sanitizedPermissions,
    useGroupDefaults: values.useGroupDefaults,
  };
}
