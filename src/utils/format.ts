const brlCentsFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyFromCents(cents: number): string {
  return brlCentsFormatter.format(cents / 100);
}

// Formata número de celular brasileiro (ex: (11) 91234-5678)
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Máscara de telefone brasileiro que aceita fixo (10 dígitos) e celular (11).
export function formatBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Formata número de telefone fixo brasileiro (ex: (11) 2345-6789)
export function formatLandline(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
}
// Funções utilitárias para formatação e máscara de CPF/CNPJ

export function formatCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCNPJ(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatBrazilianDocument(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 11) {
    return formatCPF(digits);
  }

  return formatCNPJ(digits);
}

export function formatDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function integerToWords(n: number): string {
  if (n === 0) return "zero";
  const units = [
    "",
    "um",
    "dois",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove",
  ];
  const tens = [
    "",
    "",
    "vinte",
    "trinta",
    "quarenta",
    "cinquenta",
    "sessenta",
    "setenta",
    "oitenta",
    "noventa",
  ];
  const hundreds = [
    "",
    "cento",
    "duzentos",
    "trezentos",
    "quatrocentos",
    "quinhentos",
    "seiscentos",
    "setecentos",
    "oitocentos",
    "novecentos",
  ];
  if (n === 100) return "cem";
  if (n < 20) return units[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return unit === 0 ? tens[ten] : `${tens[ten]} e ${units[unit]}`;
  }
  if (n < 1_000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return rest === 0
      ? hundreds[h]
      : `${hundreds[h]} e ${integerToWords(rest)}`;
  }
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1_000);
    const rest = n % 1_000;
    const thousandsWord =
      thousands === 1 ? "mil" : `${integerToWords(thousands)} mil`;
    if (rest === 0) return thousandsWord;
    const connector = rest < 100 || rest % 100 === 0 ? " e " : ", ";
    return `${thousandsWord}${connector}${integerToWords(rest)}`;
  }
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const millionsWord =
    millions === 1 ? "um milhão" : `${integerToWords(millions)} milhões`;
  return rest === 0
    ? millionsWord
    : `${millionsWord} e ${integerToWords(rest)}`;
}

/**
 * Formats a BRL value with its written-out extension in Brazilian Portuguese.
 * Example: 1500 → "R$ 1.500,00 (mil e quinhentos reais)"
 */
export function formatCurrencyExtended(value: number): string {
  const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

  const rounded = Math.round((value || 0) * 100);
  const reais = Math.floor(rounded / 100);
  const centavos = rounded % 100;

  const reaisWords =
    reais > 0
      ? `${integerToWords(reais)} ${reais === 1 ? "real" : "reais"}`
      : "";
  const centavosWords =
    centavos > 0
      ? `${integerToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`
      : "";

  const extenso =
    [reaisWords, centavosWords].filter(Boolean).join(" e ") || "zero reais";
  return `${brl} (${extenso})`;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const NAIVE_DATETIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,6})?)?$/;
const DISPLAY_TIME_ZONE = "America/Sao_Paulo";

function formatDateParts(day: string, month: string, year: string): string {
  return `${day}/${month}/${year}`;
}

function hasExplicitOffset(value: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

// The API mixes two date-time conventions: most endpoints pre-convert to
// Brasília wall-clock server-side and send a naive string with no Z/offset
// (see toLocalNaiveIsoString on the backend) — that string IS the value to
// show, verbatim, and must never be re-parsed as a Date (the browser would
// interpret a naive string as ITS OWN local time, not necessarily Brasília).
// A few endpoints (e.g. referral withdrawals) send a real Date field, which
// GraphQL serializes as a genuine UTC-Z instant — those need real timeZone
// conversion. Distinguish by the presence of a trailing Z/offset.
function formatNaiveDateTimeParts(value: string): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
} | null {
  const match = value.match(NAIVE_DATETIME_PATTERN);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return { year, month, day, hour, minute };
}

export function formatDateDisplay(value?: string): string {
  if (!value) return "";

  const dateMatch = value.match(ISO_DATE_PATTERN);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return formatDateParts(day, month, year);
  }

  if (!hasExplicitOffset(value)) {
    const naive = formatNaiveDateTimeParts(value);
    if (naive) {
      return formatDateParts(naive.day, naive.month, naive.year);
    }
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(parsedDate);
}

export function formatDateTimeDisplay(value?: string): string {
  if (!value) return "";

  const dateMatch = value.match(ISO_DATE_PATTERN);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return formatDateParts(day, month, year);
  }

  if (!hasExplicitOffset(value)) {
    const naive = formatNaiveDateTimeParts(value);
    if (naive) {
      return `${formatDateParts(naive.day, naive.month, naive.year)}, ${naive.hour}:${naive.minute}`;
    }
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(parsedDate);
}

// Groups typed hex characters into UUID shape (8-4-4-4-12) as the user types.
export function formatPixEvpKey(value: string): string {
  const chars = value
    .toLowerCase()
    .replace(/[^0-9a-f]/g, "")
    .slice(0, 32);

  return [
    chars.slice(0, 8),
    chars.slice(8, 12),
    chars.slice(12, 16),
    chars.slice(16, 20),
    chars.slice(20, 32),
  ]
    .filter(Boolean)
    .join("-");
}

export function sanitizeEmailInput(value: string): string {
  return value.replace(/\s/g, "");
}

export function onlyDigits(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, "");
  return maxLength ? digits.slice(0, maxLength) : digits;
}

/**
 * Money input mask: strips everything but digits and rebuilds the value as
 * a pt-BR formatted amount (dot thousands, comma decimals), treating the
 * typed digits as cents filling in from the right — e.g. "123" -> "1,23",
 * "123456" -> "1.234,56". Meant for the `onChange` of a currency `Input`.
 */
export function maskCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

  if (!digits) return "";

  const padded = digits.padStart(3, "0");
  const integerPart = padded.slice(0, -2);
  const decimalPart = padded.slice(-2);
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${withThousands},${decimalPart}`;
}

/**
 * Formats a plain number as a pt-BR money string with no currency symbol,
 * matching the shape `maskCurrencyInput` produces — e.g. 1234.5 -> "1.234,50".
 * Meant to pre-fill a currency `Input`'s value (form load, computed fields).
 */
export function formatCurrencyForInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parses a pt-BR money string (as produced by `maskCurrencyInput`, e.g.
 * "1.234,56") back into a number. Returns 0 for an empty / unparseable value.
 */
export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

/**
 * Quantity / factor input mask: keeps digits plus a single decimal
 * separator (comma), limiting the fractional part to `maxDecimals` places.
 * "1.234,5678" (4 typed) -> "1234,567" for maxDecimals = 3. Meant for the
 * `onChange` of a `NumberInput`.
 */
export function maskDecimalInput(value: string, maxDecimals = 3): string {
  const normalized = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const firstComma = normalized.indexOf(",");
  if (firstComma === -1) {
    return normalized.replace(/^0+(?=\d)/, "");
  }
  const intPart =
    normalized.slice(0, firstComma).replace(/^0+(?=\d)/, "") || "0";
  const decPart = normalized
    .slice(firstComma + 1)
    .replace(/,/g, "")
    .slice(0, maxDecimals);
  return `${intPart},${decPart}`;
}

/** Parses a `maskDecimalInput` string ("1234,56") into a number. */
export function parseDecimalInput(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Formats a number for a `NumberInput` value ("1234,5"), blank when zero. */
export function formatDecimalForInput(value: number, maxDecimals = 3): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: maxDecimals,
    useGrouping: false,
  }).format(value);
}
