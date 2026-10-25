/** Formats up to 10 US digits as (555) 123-xxxx; drops a leading +1. */
export function formatUsPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Returns an error message, or null when empty or a valid US number. */
export function validateUsPhone(formatted: string): string | null {
  if (formatted === "") return null;

  const digits = formatted.replace(/\D/g, "");
  const validShape =
    digits.length === 10 && !/^[01]/.test(digits) && !/^\d{3}[01]/.test(digits);

  return validShape ? null : "Enter a 10-digit US phone number.";
}

/** Replaces the last four digits with x: (555) 123-xxxx -> (555) 123-xxxx */
export function maskPhone(value: string): string {
  const chars = value.split("");
  let remaining = 4;

  for (let i = chars.length - 1; i >= 0 && remaining > 0; i -= 1) {
    if (/\d/.test(chars[i] ?? "")) {
      chars[i] = "x";
      remaining -= 1;
    }
  }

  return chars.join("");
}
