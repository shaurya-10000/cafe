import { Coffee } from "lucide-react";

import {
  ITEMS_ROW_CLASS,
  ITEM_CHIP_CLASS,
  ITEM_ICON_CLASS,
  ITEM_NAME_CLASS,
  ITEM_QTY_CLASS,
} from "../styles";
import type { ItemNameResolver, OrderRow } from "../types";

interface OrderItemsProps {
  order: OrderRow;
  resolveItemName: ItemNameResolver;
}

export function OrderItems({ order, resolveItemName }: OrderItemsProps) {
  return (
    <div className={ITEMS_ROW_CLASS}>
      {order.items?.map((item, index) => (
        <div
          key={`${order.id}-item-${item.item_id ?? index}`}
          className={ITEM_CHIP_CLASS}
        >
          <Coffee size={12} className={ITEM_ICON_CLASS} aria-hidden="true" />
          <span className={ITEM_NAME_CLASS}>{resolveItemName(item)}</span>
          <span className={ITEM_QTY_CLASS}>{item.quantity}</span>
        </div>
      ))}
    </div>
  );
}