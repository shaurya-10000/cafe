import { useEffect, useState } from "react";
import { Printer, Receipt, Star, X } from "lucide-react";

import { useSupabaseClient } from "@/utils/supabase/client";

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

/** Order value plus its action: Rate (completed) and printable itemized Receipt modal. */
export function OrderTotal({ order, currency, onRate }: OrderTotalProps) {
  const supabase = useSupabaseClient();
  const [showDetails, setShowDetails] = useState(false);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  const meta = order as unknown as {
    created_at?: string;
    order_type?: string;
    payment_method?: string;
    is_paid?: boolean;
    subtotal_amount?: number | string | null;
    discount_amount?: number | string | null;
  };

  useEffect(() => {
    if (!showDetails || !order.items?.length) return;
    const ids = order.items
      .map((line) => line.item_id)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return;

    let cancelled = false;
    supabase
      .from("catalog_items_public")
      .select("id, name")
      .in("id", ids)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<string, string> = {};
        for (const row of data as Array<{ id: string; name: string }>) {
          map[row.id] = row.name;
        }
        setItemNames(map);
      });
    return () => {
      cancelled = true;
    };
  }, [order.items, showDetails, supabase]);

  return (
    <>
      <div className={TOTAL_ROW_CLASS}>
        <div className="text-left lg:text-right">
          <p className={TOTAL_LABEL_CLASS}>Total Paid</p>
          <p className={TOTAL_VALUE_CLASS}>
            {formatMoney(order.total_amount, currency)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {order.status === "completed" && (
            <button
              type="button"
              onClick={() => onRate(order.id)}
              className={RATE_BUTTON_CLASS}
            >
              <Star size={16} aria-hidden="true" />
              Rate
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails(true)}
            title="View receipt"
            aria-label="View order receipt"
            className={DETAILS_BUTTON_CLASS}
          >
            <Receipt size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Order receipt"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-cafe-border bg-cafe-card p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-cafe-border pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Order Receipt
                </p>
                <p className="font-mono text-xs font-bold text-cafe-fg">
                  #{order.id.slice(0, 8)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                aria-label="Close receipt"
                className="rounded-xl p-2 text-gray-400 hover:bg-cafe-fg/5 hover:text-cafe-fg"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="space-y-2 border-b border-cafe-border pb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Items
                </p>
                <ul className="space-y-1.5 text-sm">
                  {order.items.map((line, index) => {
                    const label =
                      (line.item_id ? itemNames[line.item_id] : undefined) ||
                      line.name ||
                      "Menu Item";
                    return (
                      <li
                        key={`${line.item_id ?? "item"}-${index}`}
                        className="flex justify-between text-cafe-fg"
                      >
                        <span className="font-medium">
                          {line.quantity ?? 1}&times; {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-bold capitalize text-cafe-fg">
                  {order.status}
                </span>
              </div>
              {meta.order_type && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Type</span>
                  <span className="font-bold capitalize text-cafe-fg">
                    {meta.order_type}
                  </span>
                </div>
              )}
              {meta.payment_method && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-bold uppercase text-cafe-fg">
                    {meta.payment_method.replace("_", " ")} (
                    {meta.is_paid ? "Paid" : "Unpaid"})
                  </span>
                </div>
              )}
              {meta.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Placed</span>
                  <span className="font-mono text-xs font-bold text-cafe-fg">
                    {new Date(meta.created_at).toLocaleString()}
                  </span>
                </div>
              )}
              {Number(meta.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Discount</span>
                  <span className="font-mono font-bold">
                    -{formatMoney(meta.discount_amount ?? 0, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-cafe-border pt-3 text-base">
                <span className="font-bold text-cafe-fg">Total</span>
                <span className="font-mono font-black text-cafe-fg">
                  {formatMoney(order.total_amount, currency)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cafe-fg py-3 text-xs font-black uppercase tracking-widest text-cafe-bg"
            >
              <Printer size={15} aria-hidden="true" />
              Print Receipt
            </button>
          </div>
        </div>
      )}
    </>
  );
}