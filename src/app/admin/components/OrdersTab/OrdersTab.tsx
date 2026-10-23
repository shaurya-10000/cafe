"use client";

import { useCallback, useMemo } from "react";

import { useReducedMotion } from "framer-motion";

import { OrderCard } from "./components/OrderCard";
import { OrdersEmptyState } from "./components/OrdersEmptyState";
import { OrdersHeader } from "./components/OrdersHeader";
import { DEFAULT_CURRENCY } from "./constants";
import { useAiOrderActions } from "./hooks/useAiOrderActions";
import { useItemNames } from "./hooks/useItemNames";
import { useLatestRef } from "./hooks/useLatestRef";
import { useOrderActions } from "./hooks/useOrderActions";
import { useOrderViews } from "./hooks/useOrderViews";
import { createMoneyFormatter } from "./lib/format";
import type { OrdersTabProps } from "./types";

export function OrdersTab({
  orderView,
  setOrderView,
  orders,
  openStatusMenu,
  setOpenStatusMenu,
  handleStatusUpdate,
  handlePaymentToggle,
  currency = DEFAULT_CURRENCY,
}: OrdersTabProps) {
  const reducedMotion = useReducedMotion() ?? false;

  const formatMoney = useMemo(
    () => createMoneyFormatter(currency),
    [currency],
  );

  const { activeCount, advancedCount, displayOrders } = useOrderViews(
    orders,
    orderView,
  );

  const { resolveItemName } = useItemNames(orders);

  const actions = useOrderActions({
    onStatusUpdate: handleStatusUpdate,
    onPaymentToggle: handlePaymentToggle,
  });

  // AI concierge: "mark order X as ready", "mark order X as paid".
  useAiOrderActions(actions);

  /* ---- Stable card callbacks (cards are memoized) ------------------------ */

  const openStatusMenuRef = useLatestRef(openStatusMenu);
  const setOpenStatusMenuRef = useLatestRef(setOpenStatusMenu);

  const { updateStatus, setPaid } = actions;

  const handleToggleStatusMenu = useCallback(
    (orderId: string) => {
      setOpenStatusMenuRef.current(
        openStatusMenuRef.current === orderId ? null : orderId,
      );
    },
    [openStatusMenuRef, setOpenStatusMenuRef],
  );

  const handleCloseStatusMenu = useCallback(() => {
    setOpenStatusMenuRef.current(null);
  }, [setOpenStatusMenuRef]);

  const handleSelectStatus = useCallback(
    (orderId: string, status: string) => {
      void updateStatus(orderId, status);
      setOpenStatusMenuRef.current(null);
    },
    [setOpenStatusMenuRef, updateStatus],
  );

  const handleMarkPaid = useCallback(
    (orderId: string) => {
      void setPaid(orderId, true);
    },
    [setPaid],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-32">
      <OrdersHeader
        view={orderView}
        activeCount={activeCount}
        advancedCount={advancedCount}
        onChangeView={setOrderView}
      />

      <div className="grid grid-cols-1 gap-6">
        {displayOrders.length === 0 ? (
          <OrdersEmptyState />
        ) : (
          displayOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isStatusMenuOpen={openStatusMenu === order.id}
              reducedMotion={reducedMotion}
              formatMoney={formatMoney}
              resolveItemName={resolveItemName}
              onToggleStatusMenu={handleToggleStatusMenu}
              onCloseStatusMenu={handleCloseStatusMenu}
              onMarkPaid={handleMarkPaid}
              onSelectStatus={handleSelectStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}
