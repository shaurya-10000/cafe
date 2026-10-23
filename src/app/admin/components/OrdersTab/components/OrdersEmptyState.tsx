import { memo } from "react";

import { ShoppingBag } from "lucide-react";

export const OrdersEmptyState = memo(function OrdersEmptyState() {
  return (
    <div className="rounded-[3rem] border border-dashed border-cafe-border bg-cafe-fg/[0.01] py-24 text-center">
      <ShoppingBag
        size={40}
        className="mx-auto mb-4 text-gray-500/50"
        strokeWidth={1}
        aria-hidden="true"
      />

      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
        No orders found
      </p>
    </div>
  );
});
