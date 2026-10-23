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
      className="space-y-4 rounded-[2rem] border border-cafe-border bg-cafe-card p-6 transition-all hover:border-cafe-fg/10"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-cafe-fg/5 text-gray-500"
          >
            <User size={14} />
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-tight text-cafe-fg">
              {guestName}
            </h4>

            <p className="font-mono text-[9px] text-gray-500">{guestEmail}</p>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {locationName && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
          <MapPin size={12} aria-hidden="true" /> {locationName}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-cafe-border bg-cafe-fg/[0.02] p-3 text-[10px] font-bold text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} aria-hidden="true" /> {dateLabel}
        </div>

        <div className="flex items-center gap-1.5">
          <Clock size={12} aria-hidden="true" /> {timeLabel}
        </div>

        <div className="flex items-center gap-1.5">
          <Users size={12} aria-hidden="true" /> {partySize} Guests
        </div>
      </div>

      {specialRequests && (
        <p className="rounded-lg border border-cafe-border bg-cafe-fg/[0.03] p-2 text-[10px] text-gray-500">
          <span className="block text-[8px] font-black uppercase tracking-wider text-gray-500">
            Requests:
          </span>
          {specialRequests}
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-cafe-border pt-2">
        <ActionButtons
          status={status}
          isUpdating={isUpdating}
          onAction={(action) => void onAction(id, status, action)}
        />
      </div>
    </div>
  );
});
