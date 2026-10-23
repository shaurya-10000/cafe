import { memo } from "react";

import { SKELETON_CARD_COUNT } from "../constants";

function BookingSkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse space-y-4 rounded-[2rem] border border-cafe-border bg-cafe-card p-6"
    >
      <div className="h-8 w-8 rounded-xl bg-cafe-fg/10" />
      <div className="h-4 w-32 rounded-full bg-cafe-fg/10" />
      <div className="h-16 w-full rounded-xl bg-cafe-fg/5" />
    </div>
  );
}

export const BookingSkeletons = memo(function BookingSkeletons() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <span className="sr-only">Loading bookings&hellip;</span>

      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <BookingSkeletonCard key={index} />
      ))}
    </div>
  );
});
