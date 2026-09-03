import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import Input from "@atoms/Input";
import { copyToClipboard } from "@/utils/clipboard";
import { useToast } from "@/shared/toast/useToast";

interface ContactFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
  /** What to put on the clipboard. Defaults to the trimmed field value. */
  copyValue?: string;
  /** Href for the "open" action; omit / null / empty to hide the open button. */
  openHref?: string | null;
  /** Accessible label for the open action, e.g. "Abrir no WhatsApp". */
  openTitle?: string;
  /** Icon for the open button (defaults to an external-link glyph). */
  openIcon?: ReactNode;
}

const iconButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border " +
  "border-hairline-strong bg-field text-ink-muted transition-colors " +
  "hover:border-gold-400 hover:text-ink focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-gold-500/30 " +
  "disabled:cursor-not-allowed disabled:opacity-45";

// An editable contact / link input with an always-present "copy" action and an
// optional "open" action (mailto:, https://wa.me/…, a platform URL).
export default function ContactField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
  error,
  copyValue,
  openHref,
  openTitle = "Abrir",
  openIcon,
}: ContactFieldProps) {
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);

  const textToCopy = (copyValue ?? value).trim();

  async function handleCopy() {
    const ok = await copyToClipboard(textToCopy);
    if (!ok) {
      showError("Não foi possível copiar", "Copie manualmente o valor.");
      return;
    }
    setCopied(true);
    showSuccess("Copiado", "");
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-end gap-2">
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        error={error}
        wrapperClassName="flex-1 min-w-0"
      />
      <button
        type="button"
        className={iconButtonClass}
        onClick={handleCopy}
        disabled={!textToCopy}
        title="Copiar"
        aria-label="Copiar"
      >
        {copied ? (
          <Check size={15} className="text-ok-fg" />
        ) : (
          <Copy size={15} />
        )}
      </button>
      {openHref ? (
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className={iconButtonClass}
          title={openTitle}
          aria-label={openTitle}
        >
          {openIcon ?? <ExternalLink size={15} />}
        </a>
      ) : null}
    </div>
  );
}
