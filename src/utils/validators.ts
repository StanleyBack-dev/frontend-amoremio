export function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const calcDigit = (base: string, weightStart: number): number => {
    const sum = base
      .split("")
      .reduce(
        (acc, digit, index) => acc + Number(digit) * (weightStart - index),
        0,
      );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const base = digits.slice(0, 9);
  const digit1 = calcDigit(base, 10);
  const digit2 = calcDigit(base + String(digit1), 11);

  return digits === base + String(digit1) + String(digit2);
}

export function isValidCNPJ(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (base: string): number => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base
      .split("")
      .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base = digits.slice(0, 12);
  const digit1 = calcDigit(base);
  const digit2 = calcDigit(base + String(digit1));

  return digits === base + String(digit1) + String(digit2);
}

// A Pix mobile-phone key requires the area code plus the leading "9" digit
// mandated by Bacen for mobile numbers.
export function isValidPixMobilePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return false;

  const ddd = Number(digits.slice(0, 2));
  return ddd >= 11 && ddd <= 99 && digits[2] === "9";
}

// Validates a Brazilian document (CPF when 11 digits, CNPJ when 14). An empty
// value is considered valid so the field stays optional.
export function isBrazilianDocumentValid(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!digits) return true;
  return digits.length <= 11 ? isValidCPF(digits) : isValidCNPJ(digits);
}

const PIX_EVP_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidPixEvpKey(value: string): boolean {
  return PIX_EVP_PATTERN.test(value.trim());
}
