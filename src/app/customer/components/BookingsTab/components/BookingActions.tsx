import { Loader2, Users, X } from "lucide-react";

import { formatBookingId } from "../lib/display";
import { isCancellable } from "../lib/status";
import {
  ACTIONS_CLASS,
  CANCEL_BUTTON_CLASS,
  PARTY_LABEL_CLASS,
  PARTY_VALUE_CLASS,
} from "../styles";
import type { DisplayBooking } from "../types";

interface BookingActionsProps {
  booking: DisplayBooking;
  isCancelling: boolean;
  onRequestCancel: (booking: DisplayBooking) => void;
}

export function BookingActions({
  booking,
  isCancelling,
  onRequestCancel,
}: BookingActionsProps) {
  const { id, status, partySize } = booking;

  return (
    <div className={ACTIONS_CLASS}>
      <div className="text-left lg:text-right">
        <p className={PARTY_LABEL_CLASS}>Party Size</p>
        <p className={PARTY_VALUE_CLASS}>
          <Users size={16} className="text-gray-500" aria-hidden="true" />{" "}
          {partySize}
        </p>
      </div>

      {/* Cancel is only meaningful while the booking is still live. Once it
          is completed or already cancelled the button is omitted rather than
          shown disabled: a control that can never be enabled again is noise. */}
      {isCancellable(status) && (
        <button
          type="button"
          onClick={() => onRequestCancel(booking)}
          disabled={isCancelling}
          aria-label={`Cancel booking ${formatBookingId(id)}`}
          aria-busy={isCancelling}
          className={CANCEL_BUTTON_CLASS}
        >
          {isCancelling ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <X size={14} aria-hidden="true" />
          )}
          <span>{isCancelling ? "Cancelling" : "Cancel"}</span>
        </button>
      )}
    </div>
  );
}