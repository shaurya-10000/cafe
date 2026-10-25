import { memo } from "react";

import { Coffee } from "lucide-react";

import type { OrderItemLine } from "../types";

interface OrderItemsProps {
  orderId: string;
  items: readonly OrderItemLine[];
  resolveItemName: (line: OrderItemLine) => string;
}

export const OrderItems = memo(function OrderItems({
  orderId,
  items,
  resolveItemName,
}: OrderItemsProps) {
  return (
    <div className="flex flex-wrap gap-3 border-t border-cafe-border pt-6">
      {items.map((item, index) => (
        <div
          key={`${orderId}-item-${item.item_id ?? `idx-${index}`}`}
          className="group/item flex items-center gap-3 rounded-2xl border border-cafe-border bg-cafe-fg/[0.02] px-4 py-2.5 transition-all hover:border-cafe-accent/30"
        >
          <Coffee
            size={14}
            className="text-gray-500 transition-colors group-hover/item:text-cafe-accent"
            aria-hidden="true"
          />

          <span className="text-[10px] font-black uppercase tracking-tight text-gray-500 transition-colors group-hover/item:text-cafe-fg">
            {resolveItemName(item)}
          </span>

          <span className="min-w-[28px] rounded-lg border border-cafe-accent/10 bg-cafe-accent/10 px-2 py-0.5 text-center text-[10px] font-black text-cafe-accent">
            x{item.quantity ?? 1}
          </span>
        </div>
      ))}
    </div>
  );
});
