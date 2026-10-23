// app/admin/actions.ts
//
// Public server-action surface for orders and checkout. A "use server" file
// may only export async functions, so this stays a thin layer: the logic
// lives in plain modules under src/lib/server/orders.
"use server";

import { cancelOrderIfUnpaid } from "@/lib/server/orders/cancel";
import { processCheckout as runCheckout } from "@/lib/server/orders/checkout/processCheckout";
import { setOrderPaymentState } from "@/lib/server/orders/payment";
import { setOrderStatus } from "@/lib/server/orders/status";
import type {
  ActionOutcome,
  CancelPendingOrderResult,
  ProcessCheckoutInput,
  ProcessCheckoutResult,
} from "@/lib/server/orders/types";

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionOutcome> {
  return setOrderStatus(orderId, status);
}

/** Manually toggles is_paid (admin only; online orders need ledger proof). */
export async function toggleOrderPayment(
  orderId: string,
  isPaid: boolean,
): Promise<ActionOutcome> {
  return setOrderPaymentState(orderId, isPaid);
}

export async function processCheckout(
  data: ProcessCheckoutInput,
): Promise<ProcessCheckoutResult> {
  return runCheckout(data);
}

export async function cancelPendingOrder(
  orderId: string,
): Promise<CancelPendingOrderResult> {
  return cancelOrderIfUnpaid(orderId);
}
