import { requestPasswordRecovery } from "../../../api/auth/methods/requestPasswordRecovery";
import { resetPasswordWithRecovery } from "../../../api/auth/methods/resetPasswordWithRecovery";
import { verifyPasswordRecoveryCode } from "../../../api/auth/methods/verifyPasswordRecoveryCode";

export async function requestRecoveryCode(email: string) {
  const response = await requestPasswordRecovery({ email });

  if (!response.success) {
    throw new Error(
      response.message || "Não foi possível solicitar a recuperação de senha.",
    );
  }

  return response;
}

export async function verifyRecoveryCode(email: string, code: string) {
  const response = await verifyPasswordRecoveryCode({ email, code });

  if (!response.success) {
    throw new Error(response.message || "Não foi possível validar o código.");
  }

  return response.data;
}

export async function completePasswordRecovery(
  recoveryToken: string,
  newPassword: string,
) {
  const response = await resetPasswordWithRecovery({
    recoveryToken,
    newPassword,
  });

  if (!response.success) {
    throw new Error(response.message || "Não foi possível redefinir a senha.");
  }

  return response;
}
