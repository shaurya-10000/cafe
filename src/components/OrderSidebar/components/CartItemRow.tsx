import { memo } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { Minus, Trash2 } from "lucide-react";

import type { CartItem } from "@/types/cart";

import { cx } from "../lib/cx";
import { FOCUS_RING, GOLD_GRADIENT } from "../styles";

interface CartItemRowProps {
  item: CartItem;
  onRemoveOne: (id: string) => void | Promise<void>;
  onRemoveAll: (id: string) => void | Promise<void>;
}

export const CartItemRow = memo(function CartItemRow({
  item,
  onRemoveOne,
  onRemoveAll,
}: CartItemRowProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      layout
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-2xl border border-[#EAE9E4] bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900/40"
    >
      <div className="flex items-center gap-4">
        <div
          className={cx(
            "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black text-white shadow-md shadow-[#C5A059]/20",
            GOLD_GRADIENT,
          )}
          aria-hidden="true"
        >
          x{item.quantity}
        </div>

        <div className="flex flex-col text-left">
          <span className="text-sm font-black uppercase leading-none tracking-tight text-zinc-900 dark:text-zinc-100">
            {item.name}
          </span>

          <span className="mt-1 text-xs font-bold text-zinc-400">
            {item.price} each
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void onRemoveOne(item.id)}
          className={cx(
            "rounded-full p-2 text-zinc-400 transition-all hover:bg-[#EAE9E4] hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-zinc-100",
            FOCUS_RING,
          )}
          aria-label={`Decrease quantity of ${item.name}`}
        >
          <Minus size={14} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => void onRemoveAll(item.id)}
          className={cx(
            "rounded-full p-2 text-zinc-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30",
            FOCUS_RING,
          )}
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
});
