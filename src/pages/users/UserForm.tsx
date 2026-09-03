import { useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import SectionCard from "@/components/organisms/SectionCard";
import { colors } from "@/config";
import {
  fetchUserPagePermissions,
  getDefaultPagePermissionsByGroup,
  pagePermissionOptions,
  userGroupSelectOptions,
  userUiCopy,
  type UserFormValues,
  useUserForm,
} from "@/features/users";
import type { PageAccessKey } from "@/api/users/schema";
import { useAuthSession } from "@/features/auth";
import { useUsersContext } from "@/features/users/context/useUsersContext";
import { useToast } from "@/shared/toast/useToast";
import { userRoutePaths } from "@/router";
import { getHttpErrorMessage } from "@/api/shared/http-error";
import { formatDateTimeDisplay } from "@/utils/format";
import { ArrowLeft } from "lucide-react";

interface UserFormProps {
  mode: "create" | "edit";
  /** When rendered inside the list drawer, the id comes as a prop. */
  userId?: string;
  /** Called after a successful save (drawer mode). */
  onDone?: () => void;
}

export default function UserForm({ mode, userId, onDone }: UserFormProps) {
  const routeParams = useParams();
  const id = userId ?? routeParams.id;
  const embedded = !!onDone;
  const navigate = useNavigate();
  const { users, save, saving, unlock } = useUsersContext();
  const { showError } = useToast();
  const { session, setSession } = useAuthSession();
  const { form, editing, errors, setForm, submit } = useUserForm({
    mode,
    id,
    users,
  });

  const isAdminMaster = session?.user.group === "ADMIN_MASTER";

  const currentUserId = session?.user.idUsers;
  const loadedPermissionsForUserRef = useRef<string | null>(null);
  const formRef = useRef(form);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const effectivePermissions = useMemo(
    () => new Set(form.pagePermissions),
    [form.pagePermissions],
  );

  useEffect(() => {
    if (!isAdminMaster || mode !== "create") {
      return;
    }

    if (
      !formRef.current.useGroupDefaults ||
      formRef.current.pagePermissions.length > 0
    ) {
      return;
    }

    setForm({
      ...formRef.current,
      pagePermissions: getDefaultPagePermissionsByGroup(formRef.current.group),
      useGroupDefaults: true,
    });
  }, [isAdminMaster, mode, setForm]);

  useEffect(() => {
    if (!isAdminMaster || mode !== "edit") {
      return;
    }

    if (!editing?.idUsers || !currentUserId) {
      return;
    }

    if (loadedPermissionsForUserRef.current === editing.idUsers) {
      return;
    }

    loadedPermissionsForUserRef.current = editing.idUsers;

    void fetchUserPagePermissions(editing.idUsers)
      .then((permissions) => {
        setForm({
          ...formRef.current,
          pagePermissions: permissions.effectivePermissions,
          useGroupDefaults: !!permissions.useGroupDefaults,
        });
      })
      .catch((error) => {
        loadedPermissionsForUserRef.current = null;
        const message = getHttpErrorMessage(
          error,
          userUiCopy.errors.loadPermissionsFallback,
        );
        showError(userUiCopy.errors.loadPermissionsFallback, message);
      });
  }, [
    currentUserId,
    editing?.idUsers,
    isAdminMaster,
    mode,
    setForm,
    showError,
  ]);

  function handleGroupDefaultsToggle(enabled: boolean) {
    setForm({
      ...form,
      useGroupDefaults: enabled,
      pagePermissions: enabled
        ? getDefaultPagePermissionsByGroup(form.group)
        : form.pagePermissions,
    });
  }

  function handlePermissionToggle(permission: PageAccessKey) {
    const hasPermission = effectivePermissions.has(permission);

    if (hasPermission) {
      setForm({
        ...form,
        pagePermissions: form.pagePermissions.filter(
          (item) => item !== permission,
        ),
        useGroupDefaults: false,
      });
      return;
    }

    setForm({
      ...form,
      pagePermissions: [...form.pagePermissions, permission],
      useGroupDefaults: false,
    });
  }

  function handleGroupChange(nextGroup: UserFormValues["group"]) {
    setForm({
      ...form,
      group: nextGroup,
      pagePermissions: form.useGroupDefaults
        ? getDefaultPagePermissionsByGroup(nextGroup)
        : form.pagePermissions,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = submit(form);

    if (!result.success || !result.payload) {
      showError(
        userUiCopy.errors.invalidFormData,
        (result.errors || [userUiCopy.errors.invalidFormData]).join("\n"),
      );
      return;
    }

    await save(result.payload, editing);

    if (editing?.idUsers && session?.user.idUsers === editing.idUsers) {
      try {
        setSession(session);
      } catch {
        // best-effort: ignore errors refreshing session
      }
    }

    if (onDone) {
      onDone();
    } else {
      navigate(userRoutePaths.list);
    }
  }

  async function handleUnlock() {
    if (!editing?.idUsers) return;
    await unlock(editing.idUsers);
  }

  const isLocked =
    editing?.lockedUntil != null && new Date(editing.lockedUntil) > new Date();

  const title =
    mode === "edit" ? userUiCopy.form.editTitle : userUiCopy.form.createTitle;

  return (
    <div className="space-y-4">
      {!embedded && (
        <Button
          type="button"
          variant="outline"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate(userRoutePaths.list)}
        >
          Voltar
        </Button>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <SectionCard title={title}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === "edit" && (
              <Input
                label={userUiCopy.form.labels.createdAt}
                value={form.createdAt}
                disabled
                wrapperClassName="md:col-span-2"
              />
            )}

            <Input
              label={userUiCopy.form.labels.name}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder={userUiCopy.form.placeholders.name}
              maxLength={120}
              required={mode === "create"}
              disabled={mode === "edit"}
              error={errors.name}
              wrapperClassName={mode === "create" ? "md:col-span-2" : ""}
            />

            <Input
              label={userUiCopy.form.labels.email}
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder={userUiCopy.form.placeholders.email}
              maxLength={120}
              required={mode === "create"}
              disabled={mode === "edit"}
              error={errors.email}
            />

            <Input
              label={userUiCopy.form.labels.username}
              value={form.username}
              onChange={(event) =>
                setForm({ ...form, username: event.target.value })
              }
              placeholder={userUiCopy.form.placeholders.username}
              maxLength={40}
              required={mode === "create"}
              disabled={mode === "edit"}
              error={errors.username}
            />

            <Select
              label={userUiCopy.form.labels.group}
              value={form.group}
              onChange={(event) =>
                handleGroupChange(event.target.value as UserFormValues["group"])
              }
            >
              {userGroupSelectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            {mode === "create" ? (
              <Input
                label={userUiCopy.form.labels.urlAvatar}
                type="url"
                value={form.urlAvatar}
                onChange={(event) =>
                  setForm({ ...form, urlAvatar: event.target.value })
                }
                placeholder={userUiCopy.form.placeholders.urlAvatar}
                maxLength={255}
                error={errors.urlAvatar}
                wrapperClassName="md:col-span-2"
              />
            ) : (
              <Select
                label={userUiCopy.form.labels.status}
                value={form.status ? "true" : "false"}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value === "true" })
                }
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </Select>
            )}
          </div>
        </SectionCard>

        {isAdminMaster && (
          <SectionCard
            title={userUiCopy.form.labels.pagePermissions}
            action={
              <label
                className="flex items-center gap-2 text-xs sm:text-sm"
                style={{ color: colors.brown[300] }}
              >
                <input
                  type="checkbox"
                  checked={!!form.useGroupDefaults}
                  onChange={(event) =>
                    handleGroupDefaultsToggle(event.currentTarget.checked)
                  }
                  disabled={saving}
                />
                {userUiCopy.form.labels.useGroupDefaults}
              </label>
            }
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {pagePermissionOptions.map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: colors.brown[100],
                    color: colors.brown[300],
                  }}
                >
                  <input
                    type="checkbox"
                    checked={effectivePermissions.has(option.key)}
                    onChange={() => handlePermissionToggle(option.key)}
                    disabled={saving || !!form.useGroupDefaults}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </SectionCard>
        )}

        {mode === "edit" && (
          <SectionCard title={userUiCopy.form.labels.unlockUser}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm" style={{ color: colors.brown[300] }}>
                {editing?.lockedUntil
                  ? isLocked
                    ? `Bloqueado até ${formatDateTimeDisplay(editing.lockedUntil)}`
                    : "Não está bloqueado"
                  : "Não está bloqueado"}
              </span>
              <Button
                type="button"
                variant="outline"

                disabled={saving || !isLocked}
                onClick={handleUnlock}
                loading={saving}
              >
                Desbloquear
              </Button>
            </div>
          </SectionCard>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving}>
            {mode === "create" ? "Cadastrar usuário" : "Salvar usuário"}
          </Button>
        </div>
      </form>
    </div>
  );
}
