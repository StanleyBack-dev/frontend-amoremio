import { ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { routePaths, utilityRoutePaths } from "../router/navigation";
import {
  getDeniedReasonMessage,
  getDeniedViewLabel,
  type AccessDeniedRouteState,
} from "../features/auth/model/access-denied";

export default function AccessDenied() {
  const location = useLocation();
  const state = (location.state ?? {}) as AccessDeniedRouteState;
  const deniedViewLabel = getDeniedViewLabel(state.deniedView);
  const deniedReasonMessage = getDeniedReasonMessage(state.reasonCode);

  return (
    <div className="mx-auto w-full max-w-3xl py-10">
      <section className="rounded-lg border border-hairline bg-card p-6 shadow-card sm:p-8">
        <div className="mb-4 inline-flex rounded-md border border-err-border bg-err-bg p-3 text-err-fg">
          <ShieldAlert size={24} />
        </div>

        <h1 className="text-2xl font-semibold text-ink">Acesso negado</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {state.reasonCode === "PAGE_PERMISSION"
            ? `Você não possui permissão para acessar ${deniedViewLabel}.`
            : "Seu acesso a esta área foi bloqueado."}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {deniedReasonMessage}
        </p>

        {state.deniedPathname ? (
          <p className="mt-3 rounded-md bg-card-alt px-3 py-2 text-xs text-ink-subtle">
            Caminho solicitado: {state.deniedPathname}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={routePaths.dashboard}
            className="inline-flex h-9 items-center rounded-md bg-brand-500 px-4 text-[13px] font-semibold text-white transition hover:bg-brand-600"
          >
            Ir para o dashboard
          </Link>

          <Link
            to={utilityRoutePaths.accessDenied}
            className="inline-flex h-9 items-center rounded-md border border-hairline-strong px-4 text-[13px] font-semibold text-ink-muted transition hover:bg-card-alt hover:text-ink"
            replace
          >
            Atualizar
          </Link>
        </div>
      </section>
    </div>
  );
}
