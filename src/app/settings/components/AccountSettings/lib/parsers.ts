import type { Profile } from "../types";

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function parseProfileRow(value: unknown): Profile | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;

  return {
    full_name: nullableString(row.full_name),
    avatar_url: nullableString(row.avatar_url),
    email: nullableString(row.email),
  };
}
