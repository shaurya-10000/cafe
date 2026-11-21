"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChefHat,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Printer,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { updateOrderStatus } from "@/app/admin/actions";
import { formatCurrency } from "@/lib/utils/currency";
import { useSupabaseClient } from "@/utils/supabase/client";

import type { OrderRow } from "../OrdersTab/types";

interface KitchenOrder extends OrderRow {
  created_at?: string;
}

interface KitchenTabProps {
  orders: KitchenOrder[];
  currency?: string;
}

const KITCHEN_STATUSES = new Set([
  "incoming",
  "pending",
  "approved",
  "preparing",
  "ready",
]);

const NEXT_STEP: Record<string, { next: string; label: string } | undefined> = {
  incoming: { next: "approved", label: "Approve Order" },
  pending: { next: "approved", label: "Approve Order" },
  approved: { next: "preparing", label: "Start Preparing" },
  preparing: { next: "ready", label: "Mark Ready" },
  ready: { next: "completed", label: "Complete Order" },
};

function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio playback blocked or unsupported
  }
}

export function KitchenTab({ orders, currency = "USD" }: KitchenTabProps) {
  const supabase = useSupabaseClient();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ticketOrder, setTicketOrder] = useState<KitchenOrder | null>(null);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  const queue = useMemo(() => {
    return orders
      .filter((o) => KITCHEN_STATUSES.has(o.status))
      .sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return ta - tb;
      });
  }, [orders]);

  const prevCountRef = useRef(queue.length);
  useEffect(() => {
    if (soundEnabled && queue.length > prevCountRef.current) {
      playChime();
    }
    prevCountRef.current = queue.length;
  }, [queue.length, soundEnabled]);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        queue
          .flatMap((o) => o.items ?? [])
          .map((line) => line.item_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    if (ids.length === 0) return;

    let cancelled = false;
    supabase
      .from("catalog_items_public")
      .select("id, name")
      .in("id", ids)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next: Record<string, string> = {};
        for (const row of data as Array<{ id: string; name: string }>) {
          next[row.id] = row.name;
        }
        setItemNames(next);
      });
    return () => {
      cancelled = true;
    };
  }, [queue, supabase]);

  const resolveLineName = (line: NonNullable<OrderRow["items"]>[number]) =>
    (line.item_id ? itemNames[line.item_id] : undefined) ||
    line.name ||
    line.product_name ||
    "Menu Item";

  const handleAdvance = async (orderId: string, nextStatus: string) => {
    if (busyId) return;
    setBusyId(orderId);
    try {
      const res = await updateOrderStatus(orderId, nextStatus);
      if (!res.success) {
        toast.error(res.error ?? "Could not update order status.");
      } else {
        toast.success(`Order #${orderId.slice(0, 8)} → ${nextStatus}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cafe-border pb-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tighter text-cafe-fg md:text-4xl">
            <ChefHat size={28} className="text-cafe-accent" aria-hidden="true" />
            Kitchen Queue
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {queue.length} Active {queue.length === 1 ? "Ticket" : "Tickets"} (Oldest First)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
            soundEnabled
              ? "border-cafe-accent/30 bg-cafe-accent/10 text-cafe-accent"
              : "border-cafe-border bg-cafe-card text-gray-500"
          }`}
        >
          {soundEnabled ? (
            <Volume2 size={14} aria-hidden="true" />
          ) : (
            <VolumeX size={14} aria-hidden="true" />
          )}
          {soundEnabled ? "Chime On" : "Chime Off"}
        </button>
      </header>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[2.5rem] border border-cafe-border bg-cafe-card py-24 text-gray-500">
          <CheckCircle2 size={32} aria-hidden="true" />
          <p className="text-sm font-bold">Kitchen queue is clear</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {queue.map((order) => {
            const step = NEXT_STEP[order.status];
            const isBusy = busyId === order.id;
            return (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-[2rem] border border-cafe-border bg-cafe-card p-6 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-cafe-border pb-4">
                    <div>
                      <p className="font-mono text-xs font-black text-cafe-fg">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-gray-500">
                        {order.customer_name || "Guest"} ·{" "}
                        <span className="uppercase">{order.order_type || "pickup"}</span>
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-cafe-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cafe-accent">
                      <Flame size={11} aria-hidden="true" />
                      {order.status}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {(order.items ?? []).map((line, idx) => (
                      <li
                        key={`${line.item_id ?? "line"}-${idx}`}
                        className="flex items-center justify-between text-sm font-bold text-cafe-fg"
                      >
                        <span>
                          <span className="mr-2 inline-block rounded-md bg-cafe-fg/10 px-2 py-0.5 font-mono text-xs">
                            {line.quantity ?? 1}x
                          </span>
                          {resolveLineName(line)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 space-y-3 border-t border-cafe-border pt-4">
                  {order.created_at && (
                    <p className="flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
                      <Clock size={12} aria-hidden="true" />
                      {new Date(order.created_at).toLocaleTimeString()}
                      <span className="ml-auto font-bold text-cafe-fg">
                        {formatCurrency(order.total_amount, currency)}
                      </span>
                    </p>
                  )}

                  <div className="flex gap-2">
                    {step && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleAdvance(order.id, step.next)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cafe-fg py-3 text-[10px] font-black uppercase tracking-widest text-cafe-bg transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        {isBusy && (
                          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                        )}
                        {step.label}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setTicketOrder(order)}
                      aria-label={`Print ticket for order ${order.id.slice(0, 8)}`}
                      className="rounded-2xl border border-cafe-border px-4 py-3 text-cafe-fg transition-colors hover:bg-cafe-fg/5"
                    >
                      <Printer size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ticketOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Printable kitchen ticket"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-cafe-border bg-white p-6 font-mono text-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-dashed border-zinc-300 pb-3">
              <div>
                <p className="text-xs font-black uppercase">KITCHEN TICKET</p>
                <p className="text-sm font-bold">#{ticketOrder.id.slice(0, 8)}</p>
              </div>
              <button
                type="button"
                onClick={() => setTicketOrder(null)}
                aria-label="Close ticket"
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p>Customer: {ticketOrder.customer_name || "Guest"}</p>
              <p className="uppercase">
                Type: {ticketOrder.order_type || "pickup"}
              </p>
              {ticketOrder.created_at && (
                <p>Time: {new Date(ticketOrder.created_at).toLocaleString()}</p>
              )}
            </div>

            <ul className="space-y-2 border-y border-dashed border-zinc-300 py-3 text-sm font-bold">
              {(ticketOrder.items ?? []).map((line, idx) => (
                <li key={`${line.item_id ?? "t"}-${idx}`}>
                  {line.quantity ?? 1}x {resolveLineName(line)}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs font-black uppercase tracking-widest text-white"
            >
              <Printer size={14} aria-hidden="true" />
              Print Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}