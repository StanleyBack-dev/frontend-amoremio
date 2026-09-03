import type { ActiveView } from "../../../types/views";

export type AccessDeniedReasonCode = "PAGE_PERMISSION" | "USER_INACTIVE";

export interface AccessDeniedRouteState {
  deniedView?: ActiveView;
  deniedPathname?: string;
  reasonCode?: AccessDeniedReasonCode;
}

export function toAccessDeniedState(
  deniedView: ActiveView,
  deniedPathname: string,
): AccessDeniedRouteState {
  return {
    deniedView,
    deniedPathname,
    reasonCode: "PAGE_PERMISSION",
  };
}

export function getDeniedViewLabel(deniedView?: ActiveView): string {
  switch (deniedView) {
    case "users":
      return "Usuários";
    case "dashboard":
      return "Dashboard";
    case "profile":
      return "Perfil";
    default:
      return "esta área";
  }
}

export function getDeniedReasonMessage(
  reasonCode?: AccessDeniedReasonCode,
): string {
  switch (reasonCode) {
    case "USER_INACTIVE":
      return "Seu usuário está inativo no momento. Solicite reativação para retomar o acesso.";
    case "PAGE_PERMISSION":
    default:
      return "Você não possui permissão para acessar esta área. Solicite atualização das permissões ao administrador.";
  }
}
