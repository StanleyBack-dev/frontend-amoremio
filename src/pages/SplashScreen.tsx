import Loading from "../components/atoms/Loading";
import { brand } from "../config";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-shell">
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-6">
          <img
            src="/amoremio-logo-192.png"
            alt={brand.name}
            className="h-32 w-32 rounded-full border border-gold-600/40"
          />
          <div className="text-center">
            <h1 className="font-display text-4xl font-semibold tracking-wide text-cream">
              Amore Mio
            </h1>
            <p className="mt-2 text-[13px] uppercase tracking-[0.16em] text-gold-400">
              {brand.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Loading size={30} />
          <span className="text-[13px] font-medium text-cream-muted">
            Carregando informações...
          </span>
        </div>
      </div>
    </div>
  );
}
