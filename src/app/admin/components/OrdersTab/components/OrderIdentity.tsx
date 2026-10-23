import { memo } from "react";

import { Calendar, Clock } from "lucide-react";

import { cx } from "../lib/cx";
import type { OrderRow } from "../types";

interface OrderIdentityProps {
  order: OrderRow;
}

export const OrderIdentity = memo(function OrderIdentity({
  order,
}: OrderIdentityProps) {
  return (
    <div className="flex w-full items-center gap-6 lg:w-auto">
      <div
        aria-hidden="true"
        className={cx(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border",
          order.status === "ready"
            ? "border-green-500/20 bg-green-500/10 text-green-500"
            : order.status === "preparing"
              ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
              : "border-cafe-border bg-cafe-fg/5 text-gray-500",
        )}
      >
        {order.order_type === "scheduled" ? (
          <Calendar size={22} />
        ) : (
          <Clock size={22} />
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xl font-black uppercase tracking-tighter text-cafe-fg">
            #{order.id.slice(0, 5)}
          </span>

          <span
            className={cx(
              "rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest",
              order.is_paid
                ? "border-green-500/20 bg-green-500/10 text-green-500"
                : "border-red-500/20 bg-red-500/10 text-red-500",
            )}
          >
            {order.is_paid ? "Paid" : "Unpaid"}
          </span>
        </div>

        <p className="text-xs font-medium text-gray-500">
          {order.customer_name?.trim() || "Guest"} &bull;{" "}
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">
            {order.payment_method}
          </span>
        </p>
      </div>
    </div>
  );
});
