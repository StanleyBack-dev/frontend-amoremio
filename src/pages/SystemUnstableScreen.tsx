import { useEffect, useRef } from "react";
import { ServerCrash } from "lucide-react";
import { apiHttp } from "../api/shared/http-client";
import { brand } from "../config";

const HEALTH_CHECK_INTERVAL_MS = 15000;

export default function SystemUnstableScreen() {
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (isCheckingRef.current) {
        return;
      }

      isCheckingRef.current = true;
      apiHttp
        .get("/health")
        .catch(() => {})
        .finally(() => {
          isCheckingRef.current = false;
        });
    }, HEALTH_CHECK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-shell px-6">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <img
            src="/amoremio-logo-192.png"
            alt={brand.name}
            className="h-24 w-24 rounded-full border border-gold-600/40"
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold-600/30 bg-gold-500/10">
            <ServerCrash size={30} className="text-gold-300" />
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-3xl font-semibold tracking-wide text-cream">
            Estamos com instabilidade
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-cream-muted">
            No momento não conseguimos nos conectar aos nossos servidores. Nossa
            equipe já foi notificada e está trabalhando para resolver isso o
            quanto antes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-9 rounded-md bg-brand-500 px-6 text-[13px] font-semibold text-white transition hover:bg-brand-600"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
