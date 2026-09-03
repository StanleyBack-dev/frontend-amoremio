import { useState } from "react";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { formatCNPJ, formatCPF } from "@/utils/format";

type DocType = "CPF" | "CNPJ";

interface DocumentFieldProps {
  /** Formatted document string, e.g. "12.345.678/0001-90". */
  value: string;
  /** Fires with the newly masked value on every keystroke / type switch. */
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  wrapperClassName?: string;
}

function detectType(value: string): DocType {
  return value.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF";
}

function mask(type: DocType, raw: string): string {
  return type === "CPF" ? formatCPF(raw) : formatCNPJ(raw);
}

// A document field with a "virtual" type selector: pick CPF or CNPJ and the
// input mask + placeholder follow. The parent only stores the masked string.
export default function DocumentField({
  value,
  onChange,
  label = "Documento",
  disabled,
  error,
  wrapperClassName = "",
}: DocumentFieldProps) {
  const [type, setType] = useState<DocType>(() =>
    value ? detectType(value) : "CNPJ",
  );

  function handleTypeChange(next: DocType) {
    setType(next);
    // Re-mask the digits we already have under the new format.
    const digits = value.replace(/\D/g, "").slice(0, next === "CPF" ? 11 : 14);
    onChange(mask(next, digits));
  }

  return (
    <div className={`grid grid-cols-[7rem_1fr] gap-2 ${wrapperClassName}`}>
      <Select
        label="Tipo"
        value={type}
        disabled={disabled}
        onChange={(e) => handleTypeChange(e.target.value as DocType)}
      >
        <option value="CNPJ">CNPJ</option>
        <option value="CPF">CPF</option>
      </Select>
      <Input
        label={`${label} (${type})`}
        value={value}
        disabled={disabled}
        error={error}
        inputMode="numeric"
        placeholder={type === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
        onChange={(e) => onChange(mask(type, e.target.value))}
      />
    </div>
  );
}
