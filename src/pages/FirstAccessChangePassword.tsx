import { useNavigate } from "react-router-dom";
import Button from "../components/atoms/Button";
import Input from "../components/atoms/Input";
import EyeIcon from "../components/atoms/icons/EyeIcon";
import EyeOffIcon from "../components/atoms/icons/EyeOffIcon";
import {
  changePasswordFirstAccess,
  useAuthSession,
  useChangePasswordForm,
} from "../features/auth";
import { brand, colors, typography } from "../config";
import { routePaths } from "../router";
import { useToast } from "../shared/toast/useToast";
import { AuthApiError } from "../api/auth/methods/http-error";

export default function FirstAccessChangePassword() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { markPasswordChanged } = useAuthSession();

  const {
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
  } = useChangePasswordForm({
    onSuccess: async ({ currentPassword, newPassword }) => {
      try {
        await changePasswordFirstAccess({
          currentPassword,
          newPassword,
        });

        markPasswordChanged();

        showSuccess("Senha atualizada", "Sua senha foi alterada com sucesso.");

        navigate(routePaths.dashboard, { replace: true });
      } catch (error) {
        const message =
          error instanceof AuthApiError || error instanceof Error
            ? error.message
            : "Não foi possível atualizar sua senha.";

        showError("Falha ao alterar senha", message);
      }
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "transparent" }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 select-none">
          <img
            src="/amoremio-logo-96.png"
            alt={brand.name}
            className="w-16 h-16 rounded-full mb-4 shadow-md"
          />
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{
              color: colors.white,
              fontFamily: typography.fontFamily,
            }}
          >
            Alteração obrigatória de senha {brand.name}
          </h1>
          <p
            className="text-sm mt-1 text-center"
            style={{
              color: "#CFB4A6",
              fontFamily: typography.fontFamily,
            }}
          >
            No primeiro acesso, você precisa alterar sua senha temporária.
          </p>
        </div>

        <div
          className="rounded-lg border shadow-pop px-8 py-8"
          style={{
            borderColor: colors.brown[100],
            background: colors.black[800],
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="flex flex-col gap-5"
            noValidate
          >
            <Input
              label="Senha atual"
              type={showCurrentPassword ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => updateField("currentPassword", e.target.value)}
              error={errors.currentPassword}
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={
                    showCurrentPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                  className="flex items-center justify-center text-ink-subtle hover:text-ink transition-colors focus:outline-none"
                >
                  {showCurrentPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              }
            />

            <Input
              label="Nova senha"
              type={showNewPassword ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => updateField("newPassword", e.target.value)}
              error={errors.newPassword}
              autoComplete="new-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={
                    showNewPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                  className="flex items-center justify-center text-ink-subtle hover:text-ink transition-colors focus:outline-none"
                >
                  {showNewPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              }
            />

            <Input
              label="Confirmar nova senha"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmNewPassword}
              onChange={(e) =>
                updateField("confirmNewPassword", e.target.value)
              }
              error={errors.confirmNewPassword}
              autoComplete="new-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                  className="flex items-center justify-center text-ink-subtle hover:text-ink transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full"
            >
              Atualizar senha
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
