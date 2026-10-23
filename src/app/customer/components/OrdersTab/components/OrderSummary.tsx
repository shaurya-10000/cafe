import { formatOrderDate } from "../lib/format";
import { getStatusStyle } from "../lib/status";
import {
  DATE_CLASS,
  ORDER_ID_CLASS,
  SUMMARY_CLASS,
  buildStatusBadgeClass,
  buildStatusIconClass,
} from "../styles";
import type { OrderRow } from "../types";

export function OrderSummary({ order }: { order: OrderRow }) {
  const { Icon, wrapperClass } = getStatusStyle(order.status);

  return (
    <div className={SUMMARY_CLASS}>
      <div aria-hidden="true" className={buildStatusIconClass(wrapperClass)}>
        <Icon size={24} aria-hidden="true" />
      </div>
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={ORDER_ID_CLASS}>#{order.id.slice(0, 8)}</span>
          <span className={buildStatusBadgeClass(order.status)}>
            {order.status}
          </span>
        </div>
        <p className={DATE_CLASS}>{formatOrderDate(order.created_at)}</p>
      </div>
    </div>
  );
}