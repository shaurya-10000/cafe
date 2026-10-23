"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CANCEL_BOOKING, dispatchCafeEvent } from "@/lib/core/events";

import {
  CANCEL_BOOKING_PARAM,
  RATE_ORDER_PARAM,
  TAB_PARAM,
} from "../constants";
import { resolveTabAlias } from "../lib/tabs";
import { hrefWithoutParam } from "../lib/url";
import type { DashboardNavigation, DashboardTab, OrderView } from "../types";

interface Target {
  tab: DashboardTab;
  view: OrderView;
}

/** Where the URL points on first render. Later changes are applied per param. */
function initialTarget(
  tabParam: string | null,
  rateOrderParam: string | null,
  cancelBookingParam: string | null,
): Target {
  let target: Target = { tab: "orders", view: "active" };

  const resolved = resolveTabAlias(tabParam);
  if (resolved) target = { tab: resolved.tab, view: resolved.view ?? target.view };

  if (rateOrderParam) target = { tab: "orders", view: "past" };
  if (cancelBookingParam) target = { ...target, tab: "bookings" };

  return target;
}

/**
 * Tab + order-view state, kept in sync with the deep-link query params.
 *
 * Each param is tracked independently (by value, not by searchParams object
 * identity): the object changes on every navigation and would otherwise fight
 * the user each time they clicked a nav item. Reacting to a changed param is
 * done by adjusting state during render, guarded by the previously seen value,
 * which is React's supported alternative to a set-state-in-effect.
 */
export function useDashboardNavigation(): DashboardNavigation {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get(TAB_PARAM);
  const rateOrderParam = searchParams.get(RATE_ORDER_PARAM);
  const cancelBookingParam = searchParams.get(CANCEL_BOOKING_PARAM);

  const [initial] = useState(() =>
    initialTarget(tabParam, rateOrderParam, cancelBookingParam),
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>(initial.tab);
  const [orderView, setOrderView] = useState<OrderView>(initial.view);

  /* ---- ?tab= ----------------------------------------------------------- */

  const [seenTabParam, setSeenTabParam] = useState(tabParam);
  if (seenTabParam !== tabParam) {
    setSeenTabParam(tabParam);

    const resolved = resolveTabAlias(tabParam);
    if (resolved) {
      setActiveTab(resolved.tab);
      if (resolved.view) setOrderView(resolved.view);
    }
  }

  /* ---- ?rateOrder= ----------------------------------------------------- */
  //
  // Set by ChatWidget's RATE_ORDER action and NotificationsSidebar's
  // review_prompt click. Handed to OrdersTab, which owns the RateOrderModal.
  // Forces orders + view="past": the only view that renders the modal for a
  // specific completed order.

  const [seenRateOrderParam, setSeenRateOrderParam] = useState(rateOrderParam);
  if (seenRateOrderParam !== rateOrderParam) {
    setSeenRateOrderParam(rateOrderParam);

    if (rateOrderParam) {
      setActiveTab("orders");
      setOrderView("past");
    }
  }

  const clearRateOrder = useCallback(() => {
    if (!searchParams.has(RATE_ORDER_PARAM)) return;
    router.replace(hrefWithoutParam(searchParams.toString(), RATE_ORDER_PARAM), {
      scroll: false,
    });
  }, [router, searchParams]);

  /* ---- ?cancelBooking= handshake --------------------------------------- */
  //
  // Set by ChatWidget's CANCEL_BOOKING action. The cancel flow must go
  // through BookingsTab's own listener (it does the confirm-before-cancel
  // and the Supabase update), so there is exactly one code path that can
  // cancel a booking.
  //
  // Two steps, deliberately split:
  //   1. Force the tab to "bookings" (adjusted during render, below).
  //   2. Wait until activeTab === "bookings" *before* dispatching the event
  //      and clearing the param; by then BookingsTab has mounted and
  //      attached its listener.
  //
  // A single-effect version (dispatch on rAF, clear the param in the same
  // tick) is buggy: router.replace() changes searchParams, which re-runs the
  // effect's cleanup and cancels the rAF before it fires. Splitting across a
  // state transition avoids that.

  const [seenCancelBookingParam, setSeenCancelBookingParam] =
    useState(cancelBookingParam);
  if (seenCancelBookingParam !== cancelBookingParam) {
    setSeenCancelBookingParam(cancelBookingParam);
    if (cancelBookingParam) setActiveTab("bookings");
  }

  useEffect(() => {
    if (!cancelBookingParam) return;
    if (activeTab !== "bookings") return;

    dispatchCafeEvent(CANCEL_BOOKING, { bookingId: cancelBookingParam });

    router.replace(
      hrefWithoutParam(searchParams.toString(), CANCEL_BOOKING_PARAM),
      { scroll: false },
    );
  }, [cancelBookingParam, activeTab, router, searchParams]);

  /* ---- Sidebar selection ------------------------------------------------ */

  const selectTab = useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
    if (tab === "orders") setOrderView("active");
  }, []);

  return {
    activeTab,
    orderView,
    setOrderView,
    rateOrderId: rateOrderParam ?? undefined,
    selectTab,
    clearRateOrder,
  };
}