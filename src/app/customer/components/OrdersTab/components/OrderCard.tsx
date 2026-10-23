import { Calendar } from "lucide-react";

import { isPastStatus } from "../lib/orders";
import { CARD_CLASS, CARD_TOP_ROW_CLASS, SCHEDULED_MARKER_CLASS } from "../styles";
import type { ItemNameResolver, OrderRow, OrderView } from "../types";
import { OrderItems } from "./OrderItems";
import { OrderSummary } from "./OrderSummary";
import { OrderTotal } from "./OrderTotal";
import { StatusProgress } from "./StatusProgress";

interface OrderCardProps {
  order: OrderRow;
  view: OrderView;
  currency: string;
  resolveItemName: ItemNameResolver;
  onRate: (orderId: string) => void;
}

export function OrderCard({
  order,
  view,
  currency,
  resolveItemName,
  onRate,
}: OrderCardProps) {
  return (
    <div className={CARD_CLASS}>
      <div className={CARD_TOP_ROW_CLASS}>
        <OrderSummary order={order} />

        {/* Progress is only meaningful for in-flight orders in the active
            view; declined / refunded / completed show the status icon alone. */}
        {view === "active" && <StatusProgress status={order.status} />}

        <OrderTotal order={order} currency={currency} onRate={onRate} />
      </div>

      <OrderItems order={order} resolveItemName={resolveItemName} />

      {view === "advanced" && !isPastStatus(order.status) && (
        <div className={SCHEDULED_MARKER_CLASS}>
          <Calendar size={12} aria-hidden="true" />
          Scheduled order
        </div>
      )}
    </div>
  );
}