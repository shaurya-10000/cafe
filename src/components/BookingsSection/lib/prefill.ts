import {
  DATE_REGEX,
  MAX_PARTY_SIZE,
  SPECIAL_REQUESTS_MAX_LENGTH,
  TIME_REGEX,
} from "../constants";
import type {
  BookingFormData,
  BookingFormField,
  PrefillDetail,
} from "../types";
import { clampPartySize } from "./partySize";

/**
 * Narrow `CustomEvent.detail` into a safe, partial `BookingFormData` patch.
 * Never throws on malformed input. Accepts the legacy alias keys for one
 * major-version window.
 */
export function sanitizePrefillDetail(
  detail: unknown,
  maxPartySize: number = MAX_PARTY_SIZE,
): Partial<BookingFormData> {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return {};
  }

  const raw = detail as PrefillDetail;
  const patch: Partial<BookingFormData> = {};

  if (typeof raw.date === "string" && raw.date.trim()) {
    const trimmed = raw.date.trim();
    if (DATE_REGEX.test(trimmed)) patch.date = trimmed;
  }

  if (typeof raw.time === "string" && raw.time.trim()) {
    const trimmed = raw.time.trim();
    if (TIME_REGEX.test(trimmed)) patch.time = trimmed;
  }

  const locationId = raw.locationId ?? raw.branchId;
  if (typeof locationId === "string" && locationId.trim()) {
    patch.locationId = locationId.trim();
  }

  const partySizeRaw = raw.partySize ?? raw.guests;
  if (partySizeRaw !== undefined && partySizeRaw !== null) {
    const numeric =
      typeof partySizeRaw === "number"
        ? partySizeRaw
        : Number(String(partySizeRaw).trim());

    if (Number.isFinite(numeric)) {
      patch.partySize = String(clampPartySize(numeric, maxPartySize));
    }
  }

  const specialRequests = raw.specialRequests ?? raw.notes;
  if (typeof specialRequests === "string" && specialRequests.trim()) {
    patch.specialRequests = specialRequests
      .trim()
      .slice(0, SPECIAL_REQUESTS_MAX_LENGTH);
  }

  return patch;
}

/** Deterministic, order-independent signature for a prefill patch. */
export function prefillSignature(patch: Partial<BookingFormData>): string {
  return Object.keys(patch)
    .sort()
    .map((key) => `${key}=${String(patch[key as BookingFormField] ?? "")}`)
    .join("|");
}
