import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
} from "../../../api/users/schema";
import {
  createUserFormSchema,
  emptyUserFormValues,
  type UserFormValues,
  updateUserFormSchema,
} from "../model/form";
import { normalizeUserFormValues } from "../model/formatters";
import {
  mapUserFormToCreatePayload,
  mapUserFormToCreateValidationInput,
  mapUserFormToUpdatePayload,
  mapUserFormToUpdateValidationInput,
  mapUserToFormValues,
} from "../model/mappers";

interface UseUserFormParams {
  mode: "create" | "edit";
  id?: string;
  users: User[];
}

interface SubmitUserFormResult {
  success: boolean;
  payload?: CreateUserPayload | UpdateUserPayload;
  errors?: string[];
}

type UserFormErrors = Partial<
  Record<Extract<keyof UserFormValues, string>, string>
>;

export function useUserForm({ mode, id, users }: UseUserFormParams) {
  const [form, setForm] = useState<UserFormValues>(emptyUserFormValues);
  const [editing, setEditing] = useState<User | null>(null);
  const [errors, setErrors] = useState<UserFormErrors>({});

  useEffect(() => {
    if (mode === "edit" && id && users.length) {
      const found = users.find((user) => user.idUsers === id);
      if (found) {
        setEditing(found);
        setForm(mapUserToFormValues(found));
        setErrors({});
        return;
      }
    }

    setEditing(null);
    setForm(emptyUserFormValues);
    setErrors({});
  }, [users, id, mode]);

  const updateForm = useCallback((nextValues: UserFormValues) => {
    setErrors({});
    setForm(normalizeUserFormValues(nextValues));
  }, []);

  function validate(values: UserFormValues) {
    if (mode === "edit") {
      return updateUserFormSchema.safeParse(
        mapUserFormToUpdateValidationInput(values),
      );
    }

    return createUserFormSchema.safeParse(
      mapUserFormToCreateValidationInput(values),
    );
  }

  function mapValidationErrors(values: UserFormValues) {
    const validationResult = validate(values);

    if (validationResult.success) {
      return {};
    }

    return validationResult.error.issues.reduce(
      (acc: UserFormErrors, issue: z.ZodIssue) => {
        const field = issue.path[0];

        if (typeof field === "string" && !(field in acc)) {
          acc[field as Extract<keyof UserFormValues, string>] = issue.message;
        }

        return acc;
      },
      {},
    );
  }

  function submit(values: UserFormValues): SubmitUserFormResult {
    const result = validate(values);

    if (!result.success) {
      setErrors(mapValidationErrors(values));
      return {
        success: false,
        errors: result.error.issues.map((issue: z.ZodIssue) => issue.message),
      };
    }

    setErrors({});

    return {
      success: true,
      payload:
        mode === "edit"
          ? mapUserFormToUpdatePayload(values, editing?.idUsers)
          : mapUserFormToCreatePayload(values),
    };
  }

  return {
    form,
    editing,
    errors,
    setForm: updateForm,
    submit,
  };
}
