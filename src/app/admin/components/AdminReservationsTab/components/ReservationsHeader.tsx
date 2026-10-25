import { memo } from "react";

interface ReservationsHeaderProps {
  pendingCount: number;
}

export const ReservationsHeader = memo(function ReservationsHeader({
  pendingCount,
}: ReservationsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-cafe-border bg-cafe-fg/[0.02] p-4 sm:rounded-[2rem] sm:p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tighter text-cafe-fg">
          Booking Floor
        </h2>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          Live Booking Matrix
        </p>
      </div>

      {pendingCount > 0 && (
        <span className="shrink-0 rounded-full border border-cafe-accent/20 bg-cafe-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cafe-accent">
          {pendingCount} Pending
        </span>
      )}
    </div>
  );
});