import { NO_DATE_LABEL, NO_TIME_LABEL } from "../constants";
import type { DisplayBooking, RawBookingLike } from "../types";
import { normalizeStatus } from "./status";

export function normalizeBookingDisplay(
  raw: RawBookingLike,
  fallbackId: string,
): DisplayBooking {
  const status = normalizeStatus(raw.status);
  const partySize = raw.party_size ?? raw.guests ?? 0;
  const trimmedRequests = raw.special_requests?.trim();
  const locationName = raw.business_locations?.name?.trim();

  return {
    id: raw.id ?? fallbackId,
    status,
    dateLabel: raw.booking_date || raw.reservation_date || NO_DATE_LABEL,
    timeLabel: raw.booking_time || raw.reservation_time || NO_TIME_LABEL,
    partySize:
      typeof partySize === "number" && Number.isFinite(partySize)
        ? partySize
        : 0,
    specialRequests: trimmedRequests ? trimmedRequests : null,
    locationName: locationName ? locationName : null,
  };
}

/** "#abcdef12" from a full id, or a placeholder when missing. */
export function formatBookingId(id?: string | null): string {
  return `#${id ? id.slice(0, 8) : "------"}`;
}