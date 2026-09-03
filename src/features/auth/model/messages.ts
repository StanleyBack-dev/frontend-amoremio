export const authValidationMessages = {
  identifierRequired: "Informe seu usuário",
  identifierMin: "Usuário muito curto",
  identifierMax: "Usuário muito longo",
  emailRequired: "Informe seu e-mail",
  emailInvalid: "Informe um e-mail válido",
  recoveryCodeInvalid: "Informe o código numérico de 5 dígitos",

  passwordRequired: "Informe sua senha",
  passwordMin: "A senha deve ter pelo menos 8 caracteres",
  passwordMax: "Senha muito longa",
};

export const authApiErrorMessages = {
  AUTH_INVALID_CREDENTIALS: "Usuário ou senha inválidos.",
  AUTH_INACTIVE_USER: "Usuário inativo.",
  AUTH_CREDENTIAL_LOCKED: "Credencial temporariamente bloqueada.",
  AUTH_INVALID_CURRENT_PASSWORD: "Senha atual inválida.",
  AUTH_NEW_PASSWORD_MUST_DIFFER:
    "A nova senha deve ser diferente da senha atual.",
  AUTH_FIRST_ACCESS_PENDING:
    "Primeiro acesso pendente. Altere sua senha para continuar.",
  AUTH_INVALID_OR_REVOKED_SESSION: "Sessão inválida ou revogada.",
  AUTH_EXPIRED_SESSION: "Sessão expirada.",
  AUTH_PASSWORD_RECOVERY_CODE_INVALID_OR_EXPIRED:
    "Código de recuperação inválido ou expirado.",
  AUTH_PASSWORD_RECOVERY_NOT_ALLOWED:
    "Sua sessão de recuperação expirou. Solicite um novo código.",
} as const;
