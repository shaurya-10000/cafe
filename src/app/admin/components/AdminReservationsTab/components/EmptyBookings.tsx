import { memo } from "react";

export const EmptyBookings = memo(function EmptyBookings() {
  return (
    <div className="rounded-[3rem] border border-dashed border-cafe-border py-32 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        No bookings to review right now
      </p>
    </div>
  );
});
