import { memo } from "react";

import type { MoneyFormatter, OrderItemLine, OrderRow } from "../types";
import { MarkPaidButton } from "./MarkPaidButton";
import { OrderIdentity } from "./OrderIdentity";
import { OrderItems } from "./OrderItems";
import { OrderProgress } from "./OrderProgress";
import { OrderTotal } from "./OrderTotal";
import { StatusMenu } from "./StatusMenu";

interface OrderCardProps {
  order: OrderRow;
  isStatusMenuOpen: boolean;
  reducedMotion: boolean;
  formatMoney: MoneyFormatter;
  resolveItemName: (line: OrderItemLine) => string;
  onToggleStatusMenu: (orderId: string) => void;
  onCloseStatusMenu: () => void;
  onMarkPaid: (orderId: string) => void;
  onSelectStatus: (orderId: string, status: string) => void;
}

export const OrderCard = memo(function OrderCard({
  order,
  isStatusMenuOpen,
  reducedMotion,
  formatMoney,
  resolveItemName,
  onToggleStatusMenu,
  onCloseStatusMenu,
  onMarkPaid,
  onSelectStatus,
}: OrderCardProps) {
  const canMarkPaid = !order.is_paid && order.payment_method === "in_person";
  const hasItems = Boolean(order.items && order.items.length > 0);

  return (
    <div className="group relative flex flex-col gap-8 rounded-[3rem] border border-cafe-border bg-cafe-card p-8 transition-all hover:border-cafe-fg/10">
      <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <OrderIdentity order={order} />

        <OrderProgress status={order.status} reducedMotion={reducedMotion} />

        <div className="flex w-full items-center justify-between gap-8 border-t border-cafe-border pt-6 lg:w-auto lg:justify-end lg:border-0 lg:pt-0">
          <OrderTotal formattedTotal={formatMoney(order.total_amount)} />

          <div className="flex items-center gap-3">
            {canMarkPaid && <MarkPaidButton onClick={() => onMarkPaid(order.id)} />}

            <StatusMenu
              orderId={order.id}
              currentStatus={order.status}
              isOpen={isStatusMenuOpen}
              reducedMotion={reducedMotion}
              onToggle={onToggleStatusMenu}
              onClose={onCloseStatusMenu}
              onSelect={onSelectStatus}
            />
          </div>
        </div>
      </div>

      {hasItems && order.items && (
        <OrderItems
          orderId={order.id}
          items={order.items}
          resolveItemName={resolveItemName}
        />
      )}
    </div>
  );
});
