import { ExternalLink, Star } from "lucide-react";

import { formatMoney } from "../lib/format";
import {
  DETAILS_BUTTON_CLASS,
  RATE_BUTTON_CLASS,
  TOTAL_LABEL_CLASS,
  TOTAL_ROW_CLASS,
  TOTAL_VALUE_CLASS,
} from "../styles";
import type { OrderRow } from "../types";

interface OrderTotalProps {
  order: OrderRow;
  currency: string;
  onRate: (orderId: string) => void;
}

/** Order value plus its action: Rate (completed) or a disabled details stub. */
export function OrderTotal({ order, currency, onRate }: OrderTotalProps) {
  return (
    <div className={TOTAL_ROW_CLASS}>
      <div className="text-left lg:text-right">
        <p className={TOTAL_LABEL_CLASS}>Total Paid</p>
        <p className={TOTAL_VALUE_CLASS}>
          {formatMoney(order.total_amount, currency)}
        </p>
      </div>

      {order.status === "completed" ? (
        <button
          type="button"
          onClick={() => onRate(order.id)}
          className={RATE_BUTTON_CLASS}
        >
          <Star size={16} aria-hidden="true" />
          Rate
        </button>
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Coming soon"
          aria-label="Order details — coming soon"
          className={DETAILS_BUTTON_CLASS}
        >
          <ExternalLink size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}