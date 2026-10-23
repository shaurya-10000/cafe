import { memo } from "react";

import { ChevronLeft, RotateCcw, ShoppingBag, X } from "lucide-react";

import { cx } from "../lib/cx";
import { FOCUS_RING, GOLD_GRADIENT } from "../styles";
import type { View } from "../types";

interface SidebarHeaderProps {
  view: View;
  hasItems: boolean;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onClear: () => void;
  onClose: () => void;
}

export const SidebarHeader = memo(function SidebarHeader({
  view,
  hasItems,
  headingRef,
  onBack,
  onClear,
  onClose,
}: SidebarHeaderProps) {
  return (
    <div className="z-10 flex shrink-0 items-center justify-between border-b border-[#EAE9E4] bg-[#FAF9F6] p-6 dark:border-white/5 dark:bg-black">
      <div className="flex items-center gap-3">
        {view === "options" && (
          <button
            type="button"
            onClick={onBack}
            className={cx(
              "-ml-2 rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5",
              FOCUS_RING,
            )}
            aria-label="Back to cart"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}

        <div
          className={cx(
            GOLD_GRADIENT,
            "rounded-xl p-2 text-white shadow-xl shadow-[#C5A059]/20",
          )}
        >
          <ShoppingBag size={20} aria-hidden="true" />
        </div>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-black uppercase italic tracking-tighter text-zinc-900 outline-none dark:text-zinc-100"
        >
          {view === "cart" ? "Your Order" : "Order Type"}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {view === "cart" && hasItems && (
          <button
            type="button"
            onClick={onClear}
            className={cx(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20",
              FOCUS_RING,
            )}
          >
            <RotateCcw size={12} aria-hidden="true" />
            Clear All
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className={cx(
            "rounded-full p-2 text-zinc-900 transition-colors hover:bg-black/5 dark:text-zinc-100 dark:hover:bg-white/5",
            FOCUS_RING,
          )}
          aria-label="Close sidebar"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
