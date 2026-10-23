import { NO_DATE_LABEL } from "../constants";
import type { AdminDisplayBooking, RawAdminBooking } from "../types";
import { formatBookingTime, formatGuestEmail, formatGuestName } from "./format";
import { normalizeAdminStatus } from "./status";

export function normalizeAdminBooking(raw: RawAdminBooking): AdminDisplayBooking {
  const trimmedRequests = raw.special_requests?.trim();
  const locationName = raw.business_locations?.name?.trim();

  return {
    id: raw.id,
    guestName: formatGuestName(raw.user_name),
    guestEmail: formatGuestEmail(raw.user_email),
    dateLabel: raw.booking_date || NO_DATE_LABEL,
    timeLabel: formatBookingTime(raw.booking_time),
    partySize:
      typeof raw.party_size === "number" && Number.isFinite(raw.party_size)
        ? raw.party_size
        : 0,
    status: normalizeAdminStatus(raw.status),
    specialRequests: trimmedRequests ? trimmedRequests : null,
    locationName: locationName ? locationName : null,
  };
}
