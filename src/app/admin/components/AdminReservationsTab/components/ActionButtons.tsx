import { memo } from "react";

import { Check, CircleDot, X, type LucideIcon } from "lucide-react";

import { ACTION_LABELS } from "../constants";
import { getAvailableActions } from "../lib/status";
import type { AdminBookingStatus, BookingAction } from "../types";

const ACTION_ICONS: Record<BookingAction, LucideIcon> = {
  confirm: Check,
  reject: X,
  complete: CircleDot,
};

const ACTION_CLASS_NAMES: Record<BookingAction, string> = {
  confirm:
    "flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
  reject:
    "flex items-center justify-center gap-1.5 rounded-xl border border-cafe-border bg-cafe-fg/5 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-red-400 transition-all hover:bg-red-950/40 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
  complete:
    "flex w-full items-center justify-center gap-1.5 rounded-xl bg-cafe-fg px-4 py-3 text-[10px] font-black uppercase tracking-wider text-cafe-bg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-fg focus-visible:ring-offset-2",
};

interface ActionButtonsProps {
  guestName: string;
  status: AdminBookingStatus;
  isUpdating: boolean;
  onAction: (action: BookingAction) => void;
}

export const ActionButtons = memo(function ActionButtons({
  guestName,
  status,
  isUpdating,
  onAction,
}: ActionButtonsProps) {
  if (status === "completed") {
    return (
      <div className="w-full py-1 text-center text-[9px] font-black uppercase tracking-widest text-gray-500">
        Archived Booking
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="w-full py-1 text-center text-[9px] font-black uppercase tracking-widest text-red-500/70">
        Cancelled/Declined
      </div>
    );
  }

  return (
    <>
      {getAvailableActions(status).map((action) => {
        const Icon = ACTION_ICONS[action];

        return (
          <button
            key={action}
            type="button"
            disabled={isUpdating}
            aria-busy={isUpdating}
            aria-label={`${ACTION_LABELS[action]} for ${guestName}`}
            onClick={() => onAction(action)}
            className={ACTION_CLASS_NAMES[action]}
          >
            <Icon size={14} aria-hidden="true" /> {ACTION_LABELS[action]}
          </button>
        );
      })}
    </>
  );
});