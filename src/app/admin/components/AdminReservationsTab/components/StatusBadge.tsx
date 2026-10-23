import { memo } from "react";

import { cx } from "../lib/cx";
import { getStatusBadgeStyle } from "../lib/status";
import type { AdminBookingStatus } from "../types";

interface StatusBadgeProps {
  status: AdminBookingStatus;
}

export const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cx(
        "rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wider",
        getStatusBadgeStyle(status),
      )}
    >
      {status}
    </span>
  );
});
