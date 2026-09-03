import { useAuthSession } from "../features/auth";
import SectionCard from "@/components/organisms/SectionCard";

const GROUP_LABELS: Record<string, string> = {
  USER: "Usuário",
  ADMIN: "Administrador",
  ADMIN_MASTER: "Administrador Master",
};

export default function Profile() {
  const { session } = useAuthSession();
  const user = session?.user;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Dados da conta">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Nome
            </dt>
            <dd className="mt-1 text-sm text-ink">{user?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              E-mail
            </dt>
            <dd className="mt-1 text-sm text-ink">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Usuário
            </dt>
            <dd className="mt-1 text-sm text-ink">{user?.username ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Perfil de acesso
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {user?.group ? (GROUP_LABELS[user.group] ?? user.group) : "—"}
            </dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
