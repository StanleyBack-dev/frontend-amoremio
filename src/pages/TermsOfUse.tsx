import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@atoms/Button";
import SectionCard from "@/components/organisms/SectionCard";
import {
  fetchMyTermsAcceptanceStatus,
  LEGAL_CONTENT_VERSION_LABEL,
  PRIVACY_POLICY_SECTIONS,
  TERMS_OF_USE_SECTIONS,
  type TermsAcceptanceStatus,
} from "@/features/legal";
import { settingsRoutePaths } from "@/router/navigation";
import { colors } from "@/config";

function formatAcceptedAt(value?: string | null): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TermsOfUse() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TermsAcceptanceStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMyTermsAcceptanceStatus()
      .then((result) => {
        if (isMounted) {
          setStatus(result);
        }
      })
      .catch(() => {
        // Página é somente leitura sem esse dado — se a checagem falhar, o
        // texto dos termos continua acessível normalmente.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const acceptedAtLabel = formatAcceptedAt(status?.acceptedAt);

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        leftIcon={<ArrowLeft size={16} />}
        onClick={() => navigate(settingsRoutePaths.list)}
      >
        Voltar para Configurações
      </Button>

      <SectionCard
        title="Termos de Uso e Política de Privacidade"
        description={`Versão de ${LEGAL_CONTENT_VERSION_LABEL}.`}
      >
        {status?.accepted && (
          <div className="mb-4 flex items-center gap-3 rounded-md border border-ok-border bg-ok-bg px-4 py-3">
            <CheckCircle2 size={18} className="shrink-0 text-ok-fg" />
            <p className="text-[13px] text-ok-fg">
              Você aceitou estes termos
              {acceptedAtLabel ? ` em ${acceptedAtLabel}` : ""}.
            </p>
          </div>
        )}

        <div className="space-y-8 text-sm leading-relaxed">
          <section className="space-y-4">
            <h3
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide"
              style={{ color: colors.brown[800] }}
            >
              <ScrollText size={16} />
              Termos de Uso
            </h3>
            {TERMS_OF_USE_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <h4
                  className="text-sm font-semibold"
                  style={{ color: colors.brown[800] }}
                >
                  {section.title}
                </h4>
                <div className="space-y-2" style={{ color: colors.brown[500] }}>
                  {section.content}
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <h3
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide"
              style={{ color: colors.brown[800] }}
            >
              <ScrollText size={16} />
              Política de Privacidade
            </h3>
            {PRIVACY_POLICY_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <h4
                  className="text-sm font-semibold"
                  style={{ color: colors.brown[800] }}
                >
                  {section.title}
                </h4>
                <div className="space-y-2" style={{ color: colors.brown[500] }}>
                  {section.content}
                </div>
              </div>
            ))}
          </section>
        </div>
      </SectionCard>
    </div>
  );
}
