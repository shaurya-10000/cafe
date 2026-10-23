"use client";

import { useHasMounted } from "@/hooks/useHasMounted";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Home,
  Receipt,
  Coffee,
  Loader2,
  AlertTriangle,
  SearchX,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useSupabaseClient } from "@/utils/supabase/client";

/* -----------------------------------------------------------------------
 * Why this page calls an RPC instead of `.from("orders").select(...)`:
 *
 * orders RLS (`orders_select_own_or_admin`) is
 *   `user_id = requesting_user_id() OR is_admin_v2()`.
 * Guest checkout is a real, intentional path in this schema — orders.user_id
 * is nullable, and only `service_role` (never a browser client) may insert
 * a guest order. For a guest order, user_id is null, and `null = anything`
 * is NULL, never TRUE, in SQL — so a guest can never satisfy that RLS
 * check for their own order, no matter how long they wait. A direct table
 * read here would silently return zero rows for every guest order, and
 * this page would show "Processing Payment" forever even after the order
 * is actually paid and being made.
 *
 * public.get_order_status(uuid) is a narrow, PII-free `security definer`
 * RPC that bypasses RLS on purpose for exactly this case. The order's
 * UUID (122 bits of randomness, not sequential) is the access control —
 * same trust model as a Stripe Checkout Session id. It returns only
 * is_paid/payment_method/status, never customer_name/address/phone/items.
 *
 * Cancelled-checkout note: processCheckout's Stripe cancel_url points at
 * this same route with `?cancelled=1` appended, since there is no
 * dedicated /failed page in this app. The query param is a hint, not a
 * source of truth — the order's actual DB status (declined, via the
 * checkout.session.expired webhook) is what the copy below is driven by.
 * ------------------------------------------------------------------- */

type OrderStatus = {
  isPaid: boolean;
  paymentMethod: "online" | "in_person" | (string & {});
  status: string;
};

type Phase = "loading" | "found" | "not_found" | "error";

const CART_STORAGE_KEY = "cafe-cart";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// How long to keep re-checking a freshly-placed order for payment/kitchen
// updates before settling on whatever we last saw. This page is a
// confirmation screen, not a live order tracker — a customer who keeps it
// open for a couple of minutes right after checkout should see it update;
// beyond that, further status changes belong on their order history.
const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_MS = 2 * 60 * 1000;

const ACTIVE_STATUSES = new Set(["incoming", "pending"]);
const NEGATIVE_STATUSES = new Set(["declined", "refunded"]);

const STATUS_LABELS: Record<string, string> = {
  incoming: "Order Received",
  pending: "Pending Review",
  approved: "Approved",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  declined: "Declined",
  refunded: "Refunded",
};

function isValidOrderStatusRow(
  value: unknown,
): value is { is_paid: boolean; payment_method: string; status: string } {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.is_paid === "boolean" &&
    typeof row.payment_method === "string" &&
    typeof row.status === "string"
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");
  const supabase = useSupabaseClient();
  const shouldReduceMotion = useReducedMotion() ?? false;

  const mounted = useHasMounted();
  const [fetchedPhase, setPhase] = useState<Phase>("loading");
  const hasValidOrderId = !!orderId && UUID_PATTERN.test(orderId);
  // An invalid id is a pure function of the URL: derive it instead of
  // setting state from an effect.
  const phase: Phase = hasValidOrderId ? fetchedPhase : "not_found";
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);

  const hasCelebratedRef = useRef(false);
  const hasClearedCartRef = useRef(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (pollTimeoutRef.current !== null) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }

      if (confettiIntervalRef.current !== null) {
        clearInterval(confettiIntervalRef.current);
        confettiIntervalRef.current = null;
      }
    };
  }, []);

  const celebrate = useCallback(() => {
    if (hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;

    // Reduced motion: skip the confetti entirely. The success state is
    // already conveyed by the icon, heading, and status pill — the
    // confetti is decorative reinforcement, not information.
    if (shouldReduceMotion) return;

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 100,
    };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    // The interval handle is stored in a ref so the unmount effect can
    // clear it. Without that, navigating away mid-celebration leaves the
    // interval running against a detached canvas.
    confettiIntervalRef.current = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        if (confettiIntervalRef.current !== null) {
          clearInterval(confettiIntervalRef.current);
          confettiIntervalRef.current = null;
        }
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!orderId || !UUID_PATTERN.test(orderId)) return;

    let cancelled = false;

    const fetchStatus = async (): Promise<OrderStatus | null> => {
      const { data, error } = await supabase
        .rpc("get_order_status", { p_order_id: orderId })
        .maybeSingle();

      if (error) throw error;
      if (!data || !isValidOrderStatusRow(data)) return null;

      return {
        isPaid: data.is_paid,
        paymentMethod: data.payment_method,
        status: data.status,
      };
    };

    const isSettled = (order: OrderStatus) =>
      !ACTIVE_STATUSES.has(order.status) &&
      (order.paymentMethod === "in_person" || order.isPaid);

    const pollStartedAt = Date.now();

    const runPoll = async () => {
      try {
        const order = await fetchStatus();
        if (cancelled || !isMountedRef.current) return;

        if (!order) {
          // Only treat this as "not found" on the very first lookup — a
          // transient miss mid-poll (shouldn't happen once a row exists,
          // rows aren't deleted here) is safer to just retry than to yank
          // a confirmed order off the screen.
          setPhase((prev) => (prev === "loading" ? "not_found" : prev));
          return;
        }

        setOrderStatus(order);
        setPhase("found");

        // Only clear the cart and celebrate once we've actually confirmed
        // a real order exists — not on mount, not for a stale/bad link.
        // Clearing the cart on mere page-visit (the original behavior)
        // would wipe a customer's in-progress cart if they ever landed on
        // this URL without having actually completed checkout.
        if (!hasClearedCartRef.current) {
          hasClearedCartRef.current = true;
          try {
            localStorage.removeItem(CART_STORAGE_KEY);
          } catch {
            // Restricted storage — nothing to clean up, nothing to do.
          }
        }
        if (!NEGATIVE_STATUSES.has(order.status)) {
          celebrate();
        }

        const elapsed = Date.now() - pollStartedAt;
        if (!isSettled(order) && elapsed < MAX_POLL_MS) {
          pollTimeoutRef.current = setTimeout(runPoll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled || !isMountedRef.current) return;
        console.error(
          "[success] order status lookup failed",
          { orderId },
          err,
        );
        setPhase((prev) => (prev === "loading" ? "error" : prev));
      }
    };

    void runPoll();

    return () => {
      cancelled = true;
      if (pollTimeoutRef.current !== null) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [orderId, supabase, celebrate]);

  if (!mounted) return null;

  const isPaid = orderStatus?.isPaid ?? false;
  const isInPerson = orderStatus?.paymentMethod === "in_person";
  const isNegative = orderStatus
    ? NEGATIVE_STATUSES.has(orderStatus.status)
    : false;

  const getStatusBadge = () => {
    if (phase === "loading") {
      return (
        <Loader2
          size={14}
          className="animate-spin text-gray-400"
          aria-hidden="true"
        />
      );
    }

    if (isPaid) {
      return (
        <div className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-500">
          Paid
        </div>
      );
    }

    if (isInPerson) {
      return (
        <div className="rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-500">
          Unpaid (Pay In Person)
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-500">
        <Loader2 size={10} className="animate-spin" aria-hidden="true" />
        Processing Payment
      </div>
    );
  };

  // Not found / invalid id — don't pretend an order exists.
  if (phase === "not_found" || phase === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cafe-bg p-6 transition-colors duration-300">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 text-center"
        >
          <div className="inline-flex rounded-full bg-cafe-fg/5 p-6 text-gray-400">
            <SearchX size={40} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-cafe-fg">
              {phase === "error" ? "Something Went Wrong" : "Order Not Found"}
            </h1>
            <p className="font-medium text-gray-500">
              {phase === "error"
                ? "We couldn't load your order right now. If you were just charged, your order is still safe — please try again in a moment."
                : "This link doesn't match an order we can find. If you just checked out, check your email for a confirmation."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-cafe-fg p-5 text-xs font-black uppercase tracking-widest text-cafe-bg shadow-xl shadow-cafe-fg/10 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2"
          >
            <Home size={18} aria-hidden="true" />
            <span>Back to Menu</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const statusLabel = orderStatus
    ? STATUS_LABELS[orderStatus.status] ?? orderStatus.status
    : "—";

  return (
    <div className="custom-scrollbar flex min-h-screen items-center justify-center overflow-y-auto bg-cafe-bg p-6 transition-colors duration-300">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        {/* Status Icon */}
        <div className="relative inline-block">
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", damping: 12, delay: 0.2 }
            }
            className={[
              "relative z-10 rounded-full p-6 shadow-2xl",
              isNegative ? "bg-red-500 text-white" : "bg-cafe-fg text-cafe-bg",
            ].join(" ")}
          >
            {isNegative ? (
              <AlertTriangle
                size={48}
                strokeWidth={2.5}
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                size={48}
                strokeWidth={2.5}
                aria-hidden="true"
              />
            )}
          </motion.div>
          {!isNegative && !shouldReduceMotion && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -inset-4 z-0 rounded-full bg-cafe-fg/10"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1
            role="status"
            aria-live="polite"
            className="text-4xl font-black uppercase italic tracking-tighter text-cafe-fg"
          >
            {isNegative ? `Order ${statusLabel}` : "Order Confirmed"}
          </h1>
          <p className="font-medium text-gray-500">
            {isNegative
              ? "Get in touch if you weren't expecting this — we're happy to help sort it out."
              : "Your caffeine fix is being prepared and will be with you shortly."}
          </p>
        </div>

        {/* Order Card */}
        <div className="space-y-6 rounded-[2.5rem] border border-cafe-border bg-cafe-card p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-cafe-border pb-4">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Order ID
              </p>
              <p className="max-w-[150px] truncate text-sm font-black text-cafe-fg">
                #{orderId}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-left">
              <div
                className={[
                  "rounded-xl p-2",
                  isNegative ? "bg-red-500/10" : "bg-cafe-fg/5",
                ].join(" ")}
              >
                <Package
                  size={18}
                  className={isNegative ? "text-red-500" : "text-cafe-fg"}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-gray-400">
                  Status
                </p>
                <p className="text-xs font-bold text-cafe-fg">{statusLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="rounded-xl bg-cafe-fg/5 p-2">
                <Coffee size={18} className="text-cafe-fg" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-gray-400">
                  Estimated
                </p>
                <p className="text-xs font-bold text-cafe-fg">10-15 Mins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group flex items-center justify-between rounded-full bg-cafe-fg p-5 text-xs font-black uppercase tracking-widest text-cafe-bg shadow-xl shadow-cafe-fg/10 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3">
              <Home size={18} aria-hidden="true" />
              <span>Back to Menu</span>
            </div>
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            />
          </button>

          {/* No per-order receipt view exists yet — a live-but-dead button
              is worse than an honestly disabled one. */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Coming soon"
            className="flex cursor-not-allowed items-center justify-center gap-2 rounded-full p-5 text-xs font-black uppercase tracking-widest text-gray-300 dark:text-gray-700"
          >
            <Receipt size={16} aria-hidden="true" />
            View Full Receipt — Coming Soon
          </button>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(161, 161, 170, 0.3);
          border-radius: 20px;
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(37, 99, 235, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(161, 161, 170, 0.6);
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(37, 99, 235, 0.6);
        }
      `}</style>
    </div>
  );
}

// Wrapper to handle useSearchParams in a client component.
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cafe-bg">
          <Loader2
            className="animate-spin text-gray-400"
            size={32}
            aria-hidden="true"
          />
          <span className="sr-only">Loading order confirmation…</span>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}