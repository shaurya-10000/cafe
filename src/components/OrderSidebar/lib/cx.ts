type ClassPart = string | false | null | undefined;

/** Joins truthy class fragments. */
export function cx(...parts: ClassPart[]): string {
  return parts.filter(Boolean).join(" ");
}
