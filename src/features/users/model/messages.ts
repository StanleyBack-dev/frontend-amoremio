import {
  USER_EMAIL_MAX_LENGTH,
  USER_EMAIL_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_URL_AVATAR_MAX_LENGTH,
  USER_USERNAME_MAX_LENGTH,
  USER_USERNAME_MIN_LENGTH,
} from "./constants";

export const userUiCopy = {
  form: {
    createTitle: "Novo Usuário",
    editTitle: "Editar Usuário",
    invalidData: "Dados do formulário inválidos",
    labels: {
      name: "Nome",
      email: "Email",
      username: "Username",
      group: "Grupo",
      urlAvatar: "URL do Avatar",
      status: "Ativo",
      createdAt: "Data de Criação",
      resetPassword: "Resetar senha temporária",
      unlockUser: "Desbloquear usuário",
      pagePermissions: "Permissões de páginas",
      useGroupDefaults: "Usar permissões padrão do grupo",
    },
    placeholders: {
      name: "Maria Aparecida da Silva",
      email: "maria.silva@empresa.com",
      username: "maria.silva",
      urlAvatar: "https://example.com/avatar.jpg",
    },
    options: {
      groupUser: "Usuário",
      groupAdmin: "Administrador",
      groupAdminMaster: "Administrador Master",
    },
  },
  listing: {
    title: "Usuários",
    newAction: "Novo Usuário",
    searchPlaceholder: "Buscar usuários...",
    emptyMessage: "Nenhum usuário encontrado",
    columns: {
      name: "Nome",
      email: "Email",
      username: "Username",
      group: "Grupo",
      status: "Ativo",
      mustChangePassword: "Troca no 1º acesso",
      lastLoginAt: "Último login",
      failedLoginAttempts: "Tentativas falhas",
      lockedUntil: "Bloqueado até",
      createdAt: "Criação",
      actions: "Editar",
    },
    values: {
      active: "Sim",
      inactive: "Não",
    },
    actions: {
      edit: "Editar",
    },
  },
  errors: {
    invalidCollectionData: "Dados de usuários inválidos",
    invalidFormData: "Dados do formulário inválidos",
    invalidUserData: "Dados do usuário inválidos",
    invalidCreateUserResponse: "Resposta de criação de usuário inválida",
    invalidUpdateUserResponse: "Resposta de atualização de usuário inválida",
    invalidPermissionsData: "Resposta de permissões de página inválida",
    unlockUserFallback: "Erro ao desbloquear usuário",
    loadPermissionsFallback: "Erro ao carregar permissões de páginas",
    loadUsersFallback: "Erro ao carregar usuários",
    saveUserFallback: "Erro ao salvar usuário",
  },
  success: {
    createUser: "Usuário criado com sucesso",
    updateUser: "Usuário atualizado com sucesso",
    unlockUser: "Usuário desbloqueado com sucesso",
    resetPasswordSoon: "Reset de senha temporária será implementado em breve",
  },
} as const;

export const userValidationMessages = {
  nameRequired: "Nome obrigatório",
  nameMax: `Nome deve ter no máximo ${USER_NAME_MAX_LENGTH} caracteres`,
  emailMin: `E-mail deve ter pelo menos ${USER_EMAIL_MIN_LENGTH} caracteres`,
  emailMax: `E-mail deve ter no máximo ${USER_EMAIL_MAX_LENGTH} caracteres`,
  emailInvalid: "E-mail inválido",
  usernameMin: `Username deve ter pelo menos ${USER_USERNAME_MIN_LENGTH} caracteres`,
  usernameMax: `Username deve ter no máximo ${USER_USERNAME_MAX_LENGTH} caracteres`,
  usernamePattern:
    "Username deve conter apenas letras, números, ponto, underscore ou hífen",
  urlAvatarMax: `URL do avatar deve ter no máximo ${USER_URL_AVATAR_MAX_LENGTH} caracteres`,
  urlAvatarInvalid: "A URL do avatar deve ser válida",
} as const;
