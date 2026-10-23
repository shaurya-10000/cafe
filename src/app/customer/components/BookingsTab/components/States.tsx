import { AlertCircle, AlertTriangle, CalendarDays } from "lucide-react";

import { SKELETON_KEYS } from "../constants";
import {
  CANCEL_ERROR_CLASS,
  EMPTY_STATE_CLASS,
  ERROR_STATE_CLASS,
  LIST_ROOT_CLASS,
  SKELETON_CARD_CLASS,
} from "../styles";

function BookingSkeletonCard() {
  return (
    <div aria-hidden="true" className={SKELETON_CARD_CLASS}>
      <div className="h-14 w-14 shrink-0 rounded-2xl bg-cafe-fg/10 lg:h-16 lg:w-16" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-24 rounded-full bg-cafe-fg/10" />
        <div className="h-5 w-48 rounded-full bg-cafe-fg/10" />
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className={LIST_ROOT_CLASS}>
      <span className="sr-only">Loading bookings…</span>
      {SKELETON_KEYS.map((key) => (
        <BookingSkeletonCard key={key} />
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className={ERROR_STATE_CLASS}>
      <AlertTriangle
        size={40}
        className="mx-auto text-red-500/70"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
        {message}
      </p>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className={EMPTY_STATE_CLASS}>
      <CalendarDays
        size={48}
        className="mx-auto mb-4 text-gray-500/50"
        strokeWidth={1}
        aria-hidden="true"
      />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        No active bookings found
      </p>
    </div>
  );
}

export function CancelErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className={CANCEL_ERROR_CLASS}>
      <AlertCircle size={14} aria-hidden="true" />
      {message}
    </div>
  );
}