import { FULL_NAME_MAX_LENGTH } from "../constants";

/** Trims and collapses internal whitespace ("A   B " -> "A B"). */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidName(normalized: string): boolean {
  return normalized.length > 0 && normalized.length <= FULL_NAME_MAX_LENGTH;
}

/** Clerk stores first/last separately: first token vs. everything after it. */
export function splitFullName(normalized: string): {
  firstName: string;
  lastName: string;
} {
  const [firstName = "", ...rest] = normalized.split(" ");
  return { firstName, lastName: rest.join(" ") };
}

export function getInitial(...candidates: string[]): string {
  const source = candidates.find((value) => value.length > 0) ?? "U";
  return source.charAt(0).toUpperCase();
}
