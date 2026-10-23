import { memo } from "react";

import { ShoppingCart } from "lucide-react";

import { cn } from "../lib/cn";
import { FOCUS_RING, ICON_BUTTON_BASE, MIN_TOUCH_TARGET } from "../styles";
import { CountBadge } from "./CountBadge";

interface CartButtonProps {
  cartCount: number;
  prefersReducedMotion: boolean;
  onClick: () => void;
}

export const CartButton = memo(function CartButton({
  cartCount,
  prefersReducedMotion,
  onClick,
}: CartButtonProps) {
  const noun = cartCount === 1 ? "item" : "items";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Shopping cart with ${cartCount} ${noun}`}
      className={cn(ICON_BUTTON_BASE, MIN_TOUCH_TARGET, "p-3", FOCUS_RING)}
    >
      <ShoppingCart size={20} strokeWidth={2.5} aria-hidden="true" />

      <CountBadge
        count={cartCount}
        animate
        prefersReducedMotion={prefersReducedMotion}
      />

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {cartCount} {noun} in cart
      </span>
    </button>
  );
});
