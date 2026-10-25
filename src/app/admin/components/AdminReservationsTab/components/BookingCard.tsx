import { memo } from "react";

import { Calendar, Clock, MapPin, User, Users } from "lucide-react";

import type {
  AdminBookingStatus,
  AdminDisplayBooking,
  BookingAction,
} from "../types";
import { ActionButtons } from "./ActionButtons";
import { StatusBadge } from "./StatusBadge";

interface BookingCardProps {
  booking: AdminDisplayBooking;
  isUpdating: boolean;
  onAction: (
    id: string,
    currentStatus: AdminBookingStatus,
    action: BookingAction,
  ) => void | Promise<void>;
}

export const BookingCard = memo(function BookingCard({
  booking,
  isUpdating,
  onAction,
}: BookingCardProps) {
  const {
    id,
    guestName,
    guestEmail,
    dateLabel,
    timeLabel,
    partySize,
    status,
    specialRequests,
    locationName,
  } = booking;

  return (
    <div
      data-testid="admin-booking-card"
      data-booking-id={id}
      data-status={status}
      className="space-y-4 rounded-3xl border border-cafe-border bg-cafe-card p-5 transition-all hover:border-cafe-fg/10 sm:rounded-[2rem] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cafe-fg/5 text-gray-500"
          >
            <User size={14} />
          </div>

          <div className="min-w-0">
            <h4
              className="truncate text-sm font-bold tracking-tight text-cafe-fg"
              title={guestName}
            >
              {guestName}
            </h4>

            <p
              className="truncate font-mono text-[10px] text-gray-500"
              title={guestEmail}
            >
              {guestEmail}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={status} />
        </div>
      </div>

      {locationName && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
          <MapPin size={12} aria-hidden="true" /> {locationName}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-cafe-border bg-cafe-fg/[0.02] p-3 text-[11px] font-bold text-gray-500 sm:grid-cols-3">
        <div className="col-span-2 flex items-center gap-1.5 sm:col-span-1">
          <Calendar size={12} aria-hidden="true" /> {dateLabel}
        </div>

        <div className="flex items-center gap-1.5">
          <Clock size={12} aria-hidden="true" /> {timeLabel}
        </div>

        <div className="flex items-center gap-1.5">
          <Users size={12} aria-hidden="true" /> {partySize}{" "}
          {partySize === 1 ? "Guest" : "Guests"}
        </div>
      </div>

      {specialRequests && (
        <p className="rounded-lg border border-cafe-border bg-cafe-fg/[0.03] p-3 text-[11px] text-gray-500">
          <span className="mb-0.5 block text-[9px] font-black uppercase tracking-wider text-gray-500">
            Requests
          </span>
          {specialRequests}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-cafe-border pt-3 sm:flex-row sm:items-center">
        <ActionButtons
          guestName={guestName}
          status={status}
          isUpdating={isUpdating}
          onAction={(action) => void onAction(id, status, action)}
        />
      </div>
    </div>
  );
});