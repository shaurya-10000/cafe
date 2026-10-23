type ClassValue = string | false | null | undefined;

/** Joins truthy class names. Local on purpose: no dependency on app utils. */
export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
