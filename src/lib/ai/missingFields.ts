import type { ActionPayload } from "@/types/action";

interface ReservationFields {
  readonly date?: unknown;
  readonly time?: unknown;
  readonly partySize?: unknown;
  readonly guests?: unknown;
}

function isFilled(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * What a prefill action still leaves for the user to fill in, in the words the
 * form uses. Empty when the action is complete or doesn't prefill anything.
 */
export function describeMissingFields(action: ActionPayload): string[] {
  if (action.type !== "PREFILL_RESERVATION") return [];

  const data = (action.data ?? {}) as ReservationFields;
  const missing: string[] = [];

  if (!isFilled(data.date)) missing.push("date");
  if (!isFilled(data.time)) missing.push("arrival time");
  if (!isFilled(data.partySize) && !isFilled(data.guests)) {
    missing.push("party size");
  }

  return missing;
}
