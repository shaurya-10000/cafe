import type { FieldErrors } from "../types";

export function firstError(
  errors: FieldErrors,
  key: string,
): string | undefined {
  return errors[key]?.[0];
}

/** Id of a field's error paragraph, referenced via `aria-describedby`. */
export function errorIdFor(fieldId: string): string {
  return `${fieldId}-error`;
}

/** `aria-invalid` / `aria-describedby` for a field with an optional error. */
export function ariaErrorProps(fieldId: string, error: string | undefined) {
  return {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorIdFor(fieldId) : undefined,
  };
}
