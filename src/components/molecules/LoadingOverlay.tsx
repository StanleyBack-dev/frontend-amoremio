import Loading from "@/components/atoms/Loading";

type LoadingOverlayProps = {
  open: boolean;
  label?: string;
  // Optional class to customize the inner card.
  className?: string;
};

// Full-screen overlay with a transparent scrim: it blocks interaction while a
// blocking async task is in flight (opening a form, loading a record) and
// shows a centered spinner card in the project style.
export default function LoadingOverlay({
  open,
  label,
  className = "",
}: LoadingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-xl border border-hairline bg-card px-6 py-5 shadow-pop ${className}`}
      >
        <Loading size={24} label={label || "Carregando..."} />
      </div>
    </div>
  );
}
