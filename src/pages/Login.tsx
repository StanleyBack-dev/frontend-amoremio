import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithPassword, useLoginForm } from "../features/auth";
import Input from "../components/atoms/Input";
import Button from "../components/atoms/Button";
import Checkbox from "../components/atoms/Checkbox";
import EyeIcon from "../components/atoms/icons/EyeIcon";
import EyeOffIcon from "../components/atoms/icons/EyeOffIcon";
import SplashScreen from "./SplashScreen";
import { brand } from "../config";
import { useToast } from "../shared/toast/useToast";
import { authRoutePaths, routePaths } from "../router";
import { useAuthSession } from "../features/auth";
import { AuthApiError } from "../api/auth/methods/http-error";

export default function Login() {
  const navigate = useNavigate();
  const { showError, showSuccess, showToast } = useToast();
  const {
    setSession,
    isAuthenticated,
    requiresPasswordChange,
    isInitializing,
  } = useAuthSession();

  useEffect(() => {
    if (isInitializing || !isAuthenticated) return;

    navigate(
      requiresPasswordChange
        ? authRoutePaths.firstAccessChangePassword
        : routePaths.dashboard,
      { replace: true },
    );
  }, [isAuthenticated, isInitializing, navigate, requiresPasswordChange]);

  const {
    form,
    updateField,
    errors,
    showPassword,
    toggleShowPassword,
    submit,
    submitting,
  } = useLoginForm({
    onSuccess: async ({ identifier, password }) => {
      try {
        const session = await loginWithPassword({
          username: identifier,
          password,
        });

        if (!session.authenticated) {
          showError(
            "Falha no login",
            "Não foi possível autenticar com estas credenciais.",
          );
          return;
        }

        setSession(session);
        showSuccess("Login realizado", `Bem-vindo, ${session.user.name}.`);

        if (session.mustChangePassword) {
          showToast({
            variant: "info",
            title: "Alteração de senha pendente",
            description:
              "Seu usuário requer troca de senha no primeiro acesso.",
          });

          navigate(authRoutePaths.firstAccessChangePassword, {
            replace: true,
          });
          return;
        }

        navigate(routePaths.dashboard, { replace: true });
      } catch (error) {
        const message =
          error instanceof AuthApiError || error instanceof Error
            ? error.message
            : "Não foi possível realizar o login. Tente novamente.";

        showError("Erro ao entrar", message);
      }
    },
  });

  // While the app is still checking for an existing session (cookie refresh),
  // or once it finds one and is about to redirect, show the splash instead of
  // flashing the login form.
  if (isInitializing || isAuthenticated) {
    return <SplashScreen />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-shell px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logotipo */}
        <div className="mb-8 flex select-none flex-col items-center">
          <img
            src="/amoremio-logo-96.png"
            alt={brand.name}
            className="mb-4 h-16 w-16 rounded-full border border-gold-600/40 shadow-lg"
          />
          <h1 className="font-display text-3xl font-semibold tracking-wide text-cream">
            Amore Mio
          </h1>
          <p className="mt-1 text-[13px] text-cream-muted">
            Acesse sua conta para continuar
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-lg border border-hairline bg-card px-8 py-8 shadow-pop">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (submitting) return;
              void submit();
            }}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Usuário */}
            <Input
              label="Usuário"
              type="text"
              placeholder="Digite seu usuário"
              value={form.identifier}
              onChange={(e) => updateField("identifier", e.target.value)}
              error={errors.identifier}
              autoComplete="username"
              autoFocus
              disabled={submitting}
            />

            {/* Senha */}
            <Input
              label="Senha"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              error={errors.password}
              autoComplete="current-password"
              disabled={submitting}
              trailing={
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  disabled={submitting}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="flex items-center justify-center text-ink-subtle transition-colors hover:text-ink focus:outline-none disabled:opacity-40"
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              }
            />

            {/* Lembrar usuário */}
            <Checkbox
              label="Lembrar meu usuário"
              checked={form.rememberMe}
              onChange={(e) => updateField("rememberMe", e.target.checked)}
              disabled={submitting}
              wrapperClassName={submitting ? "opacity-60" : ""}
            />

            {/* Botão de entrar */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={submitting}
              className="w-full mt-1"
            >
              Entrar
            </Button>

            <button
              type="button"
              disabled={submitting}
              className="text-[13px] font-medium text-brand-500 transition-colors hover:text-brand-600 disabled:opacity-40"
              onClick={() => navigate(authRoutePaths.passwordRecovery)}
            >
              Esqueci minha senha
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p className="mt-6 text-center text-xs text-cream-subtle">
          &copy; {new Date().getFullYear()} {brand.name}. Todos os direitos
          reservados.
        </p>
      </div>
    </div>
  );
}
