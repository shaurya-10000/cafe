import { memo } from "react";

import { ArrowRight, Loader2 } from "lucide-react";

import { cx } from "../lib/cx";
import { FOCUS_RING, GOLD_GRADIENT } from "../styles";
import type { View } from "../types";

interface CheckoutButtonProps {
  view: View;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export const CheckoutButton = memo(function CheckoutButton({
  view,
  disabled,
  loading,
  onClick,
}: CheckoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(
        "group flex w-full items-center justify-between rounded-full p-6 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-[#C5A059]/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        GOLD_GRADIENT,
        FOCUS_RING,
      )}
    >
      {loading ? (
        <div className="mx-auto flex items-center gap-3">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          <span>INITIALIZING...</span>
        </div>
      ) : (
        <>
          <span className="mx-auto">
            {view === "cart" ? "PROCEED TO PROTOCOL" : "CONFIRM TRANSACTION"}
          </span>

          <ArrowRight
            size={18}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          />
        </>
      )}
    </button>
  );
});
