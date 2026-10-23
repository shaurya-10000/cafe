import { CARD_CLASS, CARD_TOP_ROW_CLASS } from "../styles";
import type { DisplayBooking } from "../types";
import { BookingActions } from "./BookingActions";
import { BookingProgress } from "./BookingProgress";
import { BookingSummary } from "./BookingSummary";
import { SpecialRequests } from "./SpecialRequests";

interface BookingCardProps {
  booking: DisplayBooking;
  isCancelling: boolean;
  onRequestCancel: (booking: DisplayBooking) => void;
}

export function BookingCard({
  booking,
  isCancelling,
  onRequestCancel,
}: BookingCardProps) {
  const { id, status, specialRequests } = booking;

  return (
    <li
      data-testid="booking-card"
      data-booking-id={id}
      data-status={status}
      className={CARD_CLASS}
    >
      <div className={CARD_TOP_ROW_CLASS}>
        <BookingSummary booking={booking} />

        {status !== "cancelled" && <BookingProgress status={status} />}

        <BookingActions
          booking={booking}
          isCancelling={isCancelling}
          onRequestCancel={onRequestCancel}
        />
      </div>

      {specialRequests && <SpecialRequests text={specialRequests} />}
    </li>
  );
}