import { memo } from "react";

interface EmptyBookingsProps {
  message?: string;
}

export const EmptyBookings = memo(function EmptyBookings({
  message = "No bookings to review right now",
}: EmptyBookingsProps) {
  return (
    <div className="rounded-3xl border border-dashed border-cafe-border py-20 text-center sm:rounded-[3rem] sm:py-32">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        {message}
      </p>
    </div>
  );
});