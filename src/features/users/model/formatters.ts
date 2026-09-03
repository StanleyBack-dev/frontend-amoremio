import type { UserFormValues } from "./form";

export function normalizeUserFormValues(
  nextValues: UserFormValues,
): UserFormValues {
  return {
    ...nextValues,
    name: nextValues.name,
    email: nextValues.email,
    username: nextValues.username,
    urlAvatar: nextValues.urlAvatar,
  };
}
