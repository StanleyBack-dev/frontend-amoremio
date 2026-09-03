import { useState } from "react";
import { loginFormSchema, type LoginFormValues } from "../model/form";

const STORAGE_KEY = "amoremio_auth_remember";

type RememberedData = { identifier: string };

function getRemembered(): RememberedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "identifier" in parsed &&
      typeof (parsed as Record<string, unknown>).identifier === "string"
    ) {
      return parsed as RememberedData;
    }
    return null;
  } catch {
    return null;
  }
}

function saveRemembered(data: RememberedData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearRemembered(): void {
  localStorage.removeItem(STORAGE_KEY);
}

type LoginFormErrors = Partial<
  Record<keyof Omit<LoginFormValues, "rememberMe">, string>
>;

interface UseLoginFormProps {
  onSuccess?: (values: {
    identifier: string;
    password: string;
  }) => void | Promise<void>;
}

export function useLoginForm({ onSuccess }: UseLoginFormProps = {}) {
  const remembered = getRemembered();

  const [form, setForm] = useState<LoginFormValues>({
    identifier: remembered?.identifier ?? "",
    password: "",
    rememberMe: !!remembered,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof LoginFormValues>(
    key: K,
    value: LoginFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key !== "rememberMe" && errors[key as keyof LoginFormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function submit() {
    const result = loginFormSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: LoginFormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LoginFormErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (form.rememberMe) {
      saveRemembered({ identifier: form.identifier });
    } else {
      clearRemembered();
    }

    setSubmitting(true);
    try {
      await onSuccess?.({
        identifier: form.identifier,
        password: form.password,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form,
    updateField,
    errors,
    showPassword,
    toggleShowPassword: () => setShowPassword((v) => !v),
    submit,
    submitting,
  };
}
