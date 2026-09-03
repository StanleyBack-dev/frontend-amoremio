import { useState } from "react";
import {
  changePasswordFormSchema,
  emptyChangePasswordFormValues,
  type ChangePasswordFormValues,
} from "../model/change-password-form";

type ChangePasswordFormErrors = Partial<
  Record<keyof ChangePasswordFormValues, string>
>;

interface UseChangePasswordFormProps {
  onSuccess: (values: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
}

export function useChangePasswordForm({
  onSuccess,
}: UseChangePasswordFormProps) {
  const [form, setForm] = useState<ChangePasswordFormValues>(
    emptyChangePasswordFormValues,
  );
  const [errors, setErrors] = useState<ChangePasswordFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function updateField<K extends keyof ChangePasswordFormValues>(
    key: K,
    value: ChangePasswordFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function submit() {
    const parsed = changePasswordFormSchema.safeParse(form);

    if (!parsed.success) {
      const fieldErrors: ChangePasswordFormErrors = {};

      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ChangePasswordFormErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }

      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      await onSuccess({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form,
    errors,
    submitting,
    updateField,
    submit,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
  };
}
