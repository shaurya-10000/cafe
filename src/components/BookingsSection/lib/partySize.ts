import {
  DEFAULT_BOOKING_FORM_DATA,
  HARD_MAX_PARTY_SIZE,
  MAX_PARTY_SIZE,
  MIN_PARTY_SIZE,
} from "../constants";

export function isValidPartySize(
  value: string,
  max: number = MAX_PARTY_SIZE,
): boolean {
  const normalized = value.trim();

  if (!normalized || !/^\d+$/.test(normalized)) return false;

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed)) return false;

  return (
    parsed >= MIN_PARTY_SIZE && parsed <= Math.min(max, HARD_MAX_PARTY_SIZE)
  );
}

export function clampPartySize(
  value: number,
  max: number = MAX_PARTY_SIZE,
): number {
  const ceiling = Math.min(max, HARD_MAX_PARTY_SIZE);

  if (!Number.isFinite(value)) {
    return Math.min(Number(DEFAULT_BOOKING_FORM_DATA.partySize), ceiling);
  }

  return Math.min(ceiling, Math.max(MIN_PARTY_SIZE, Math.round(value)));
}
