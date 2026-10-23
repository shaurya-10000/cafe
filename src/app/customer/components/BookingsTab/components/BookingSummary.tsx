import { MapPin } from "lucide-react";

import { formatBookingId } from "../lib/display";
import { getStatusIconKind } from "../lib/status";
import {
  DATE_CLASS,
  ID_CLASS,
  LOCATION_CLASS,
  SUMMARY_CLASS,
  buildStatusBadgeClass,
  buildStatusIconClass,
} from "../styles";
import type { DisplayBooking } from "../types";
import { BookingStatusIcon } from "./BookingStatusIcon";

export function BookingSummary({ booking }: { booking: DisplayBooking }) {
  const { id, status, dateLabel, timeLabel, locationName } = booking;

  return (
    <div className={SUMMARY_CLASS}>
      <div aria-hidden="true" className={buildStatusIconClass(status)}>
        <BookingStatusIcon kind={getStatusIconKind(status)} />
      </div>
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={ID_CLASS}>{formatBookingId(id)}</span>
          <span className={buildStatusBadgeClass(status)}>{status}</span>
          {locationName && (
            <span className={LOCATION_CLASS}>
              <MapPin size={9} aria-hidden="true" /> {locationName}
            </span>
          )}
        </div>
        <p className={DATE_CLASS}>
          {dateLabel} @ {timeLabel}
        </p>
      </div>
    </div>
  );
}