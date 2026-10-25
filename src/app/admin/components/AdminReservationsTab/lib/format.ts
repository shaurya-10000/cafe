import { DEFAULT_GUEST_NAME, NO_EMAIL_LABEL } from "../constants";

export { formatBookingDate, formatBookingTime } from "@/lib/bookingFormat";

export function formatGuestName(name?: string | null): string {
  const trimmed = name?.trim();

  return trimmed ? trimmed : DEFAULT_GUEST_NAME;
}

export function formatGuestEmail(email?: string | null): string {
  const trimmed = email?.trim();

  return trimmed ? trimmed : NO_EMAIL_LABEL;
}