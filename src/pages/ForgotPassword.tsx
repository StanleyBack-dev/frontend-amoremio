import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/atoms/Button";
import Input from "../components/atoms/Input";
import { brand, colors, typography } from "../config";
import { AuthApiError } from "../api/auth/methods/http-error";
import {
  requestRecoveryCode,
  verifyRecoveryCode,
} from "../features/auth/services/password-recovery.service";
import { authRoutePaths } from "../router";
import { useToast } from "../shared/toast/useToast";
import { savePasswordRecoverySession } from "../features/auth/utils/passwordRecoveryStorage";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();

  async function handleRequestCode() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError("Informe o e-mail cadastrado");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isValidEmail) {
      setEmailError("Informe um e-mail válido");
      return;
    }

    setEmailError(undefined);
    setRequesting(true);

    try {
      await requestRecoveryCode(normalizedEmail);
      setEmail(normalizedEmail);
      setStep("verify");
      showSuccess(
        "Código enviado",
        "Se o e-mail estiver cadastrado, enviamos um código de recuperação.",
      );
    } catch (error) {
      const message =
        error instanceof AuthApiError || error instanceof Error
          ? error.message
          : "Não foi possível enviar o código de recuperação.";
      showError("Falha ao solicitar código", message);
    } finally {
      setRequesting(false);
    }
  }

  async function handleVerifyCode() {
    const normalizedCode = code.replace(/\D/g, "").slice(0, 5);

    if (normalizedCode.length !== 5) {
      setCodeError("Informe o código de 5 dígitos enviado por e-mail");
      return;
    }

    setCodeError(undefined);
    setVerifying(true);

    try {
      const result = await verifyRecoveryCode(email, normalizedCode);
      savePasswordRecoverySession({
        email,
        expiresAt: result.expiresAt,
        recoveryToken: result.recoveryToken,
      });
      showSuccess(
        "Código validado",
        "Agora você pode cadastrar sua nova senha.",
      );
      navigate(authRoutePaths.passwordRecoveryReset, { replace: true });
    } catch (error) {
      const message =
        error instanceof AuthApiError || error instanceof Error
          ? error.message
          : "Não foi possível validar o código informado.";
      showError("Código inválido", message);
    } finally {
      setVerifying(false);
    }
  }

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
            className="text-2xl font-bold tracking-tight text-center"
            style={{
              color: colors.white,
              fontFamily: typography.fontFamily,
            }}
          >
            Recuperar senha {brand.name}
          </h1>
          <p
            className="text-sm mt-1 text-center"
            style={{
              color: "#CFB4A6",
              fontFamily: typography.fontFamily,
            }}
          >
            {step === "request"
              ? "Informe seu e-mail para receber um código numérico de recuperação."
              : "Digite o código de 5 dígitos enviado para o seu e-mail."}
          </p>
        </div>

        <div
          className="rounded-lg border shadow-pop px-8 py-8"
          style={{
            borderColor: colors.brown[100],
            background: colors.black[800],
          }}
        >
          {step === "request" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleRequestCode();
              }}
              className="flex flex-col gap-5"
              noValidate
            >
              <Input
                label="E-mail"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={emailError}
                autoComplete="email"
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={requesting}
                className="w-full"
              >
                Enviar código
              </Button>
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleVerifyCode();
              }}
              className="flex flex-col gap-5"
              noValidate
            >
              <Input label="E-mail" type="email" value={email} disabled />

              <Input
                label="Código de verificação"
                type="text"
                inputMode="numeric"
                placeholder="00000"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 5))
                }
                error={codeError}
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={verifying}
                className="w-full"
              >
                Validar código
              </Button>

              <button
                type="button"
                className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
                onClick={() => {
                  setCode("");
                  setCodeError(undefined);
                  void handleRequestCode();
                }}
              >
                Reenviar código
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
            onClick={() => navigate(authRoutePaths.login)}
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}
