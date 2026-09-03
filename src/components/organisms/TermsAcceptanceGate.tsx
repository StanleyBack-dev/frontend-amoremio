import { useState } from "react";
import { ScrollText } from "lucide-react";
import Button from "@atoms/Button";
import Checkbox from "@atoms/Checkbox";
import { useAuthSession } from "@/features/auth";
import {
  LEGAL_CONTENT_VERSION_LABEL,
  PRIVACY_POLICY_SECTIONS,
  requestAcceptTermsOfUse,
  TERMS_OF_USE_SECTIONS,
} from "@/features/legal";
import { useToast } from "@/shared/toast/useToast";

export default function TermsAcceptanceGate() {
  const { session, markTermsAccepted } = useAuthSession();
  const { showError } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session || session.termsAccepted) {
    return null;
  }

  const isReacceptance = Boolean(session.isTermsReacceptance);

  async function handleContinue() {
    setIsSubmitting(true);

    try {
      await requestAcceptTermsOfUse();
      markTermsAccepted();
    } catch (error) {
      showError(
        "Não foi possível registrar seu aceite",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-hairline bg-card shadow-pop">
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gold-300 bg-gold-100 text-gold-700">
            <ScrollText size={20} />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-[15px] font-semibold text-ink">
              {isReacceptance
                ? "Atualizamos nossos Termos de Uso e Política de Privacidade"
                : "Termos de Uso e Política de Privacidade"}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {isReacceptance
                ? `Algumas cláusulas foram alteradas desde o seu último aceite. Leia o conteúdo atualizado abaixo e confirme que concorda para continuar usando o Amore Mio. Versão de ${LEGAL_CONTENT_VERSION_LABEL}.`
                : `Antes de continuar, leia e confirme que concorda com os termos abaixo. Versão de ${LEGAL_CONTENT_VERSION_LABEL}.`}
            </p>
          </div>
        </div>

        <div className="max-h-[45vh] space-y-6 overflow-y-auto border-y border-hairline px-6 py-4 text-[13px] leading-relaxed text-ink-muted">
          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink">
              Termos de Uso
            </h3>
            {TERMS_OF_USE_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <h4 className="text-sm font-semibold">{section.title}</h4>
                <div className="space-y-2">{section.content}</div>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink">
              Política de Privacidade
            </h3>
            {PRIVACY_POLICY_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <h4 className="text-sm font-semibold">{section.title}</h4>
                <div className="space-y-2">{section.content}</div>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-4 p-6">
          <Checkbox
            label={
              isReacceptance
                ? "Li e concordo com os Termos de Uso e a Política de Privacidade atualizados."
                : "Li e concordo com os Termos de Uso e a Política de Privacidade."
            }
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              loading={isSubmitting}
              disabled={!agreed || isSubmitting}
              onClick={() => {
                void handleContinue();
              }}
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
