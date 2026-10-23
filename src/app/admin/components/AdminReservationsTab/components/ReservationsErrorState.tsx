import { memo } from "react";

import { AlertTriangle } from "lucide-react";

interface ReservationsErrorStateProps {
  message: string;
}

export const ReservationsErrorState = memo(function ReservationsErrorState({
  message,
}: ReservationsErrorStateProps) {
  return (
    <div className="mx-auto max-w-7xl">
      <div
        role="alert"
        className="space-y-3 rounded-[3rem] border border-red-500/30 bg-red-500/5 py-20 text-center"
      >
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
    </div>
  );
});
