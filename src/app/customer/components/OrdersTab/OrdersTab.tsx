"use client";

import { AnimatePresence } from "framer-motion";

import RateOrderModal from "../RateOrderModal";
import { EmptyState, OrderCard, ViewSwitcher } from "./components";
import { DEFAULT_CURRENCY } from "./constants";
import {
  useOrderBuckets,
  useRatingModal,
  useResolvedItemNames,
} from "./hooks";
import { ROOT_CLASS } from "./styles";
import type { OrdersTabProps } from "./types";

/**
 * Customer orders: Active / Scheduled / Past views, live item names, and the
 * rating modal (opened by the Rate button or the ?rateOrder= deep link).
 */
export function OrdersTab({
  orders,
  view,
  setView,
  currency = DEFAULT_CURRENCY,
  externalRatingOrderId,
  onExternalRatingClosed,
}: OrdersTabProps) {
  const buckets = useOrderBuckets(orders);
  const resolveItemName = useResolvedItemNames(orders);
  const { ratingOrderId, openRating, closeRating } = useRatingModal({
    orders,
    externalRatingOrderId,
    onExternalRatingClosed,
  });

  const displayOrders = buckets[view];

  return (
    <div className={ROOT_CLASS}>
      <ViewSwitcher
        view={view}
        counts={{
          active: buckets.active.length,
          advanced: buckets.advanced.length,
          past: buckets.past.length,
        }}
        onChange={setView}
      />

      {displayOrders.length === 0 ? (
        <EmptyState view={view} />
      ) : (
        displayOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            view={view}
            currency={currency}
            resolveItemName={resolveItemName}
            onRate={openRating}
          />
        ))
      )}

      <AnimatePresence initial={false}>
        {ratingOrderId && (
          <RateOrderModal
            key={ratingOrderId}
            orderId={ratingOrderId}
            onClose={closeRating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}