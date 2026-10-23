import { memo } from "react";

import { ShoppingBag } from "lucide-react";

import { cn } from "../lib/cn";
import { FOCUS_RING } from "../styles";

interface OrderNowButtonProps {
  onClick: () => void;
}

export const OrderNowButton = memo(function OrderNowButton({
  onClick,
}: OrderNowButtonProps) {
  return (
    <div
      className={cn(
        "hidden items-center justify-center lg:flex",
        "rounded-2xl border border-cafe-border",
        "bg-cafe-fg/5 p-1",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group flex items-center gap-2 rounded-xl",
          "px-6 py-2",
          "text-[11px] font-black uppercase tracking-[0.2em]",
          "text-cafe-fg",
          "transition-colors duration-200",
          "hover:bg-cafe-bg hover:shadow-sm",
          FOCUS_RING,
        )}
      >
        <ShoppingBag
          size={14}
          strokeWidth={3}
          aria-hidden="true"
          className="text-cafe-accent transition-transform duration-200 group-hover:scale-110"
        />

        Order Now
      </button>
    </div>
  );
});
