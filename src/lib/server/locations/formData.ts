/** Trimmed string value, or `undefined` when missing/empty. Never trust `as string`. */
export function getOptionalString(
  formData: FormData,
  key: string,
): string | undefined {
  const value = formData.get(key);

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

/** HTML checkboxes submit "on" (or nothing), never "true"/"false". */
export function parseCheckbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);

  return value === "on" || value === "true";
}
