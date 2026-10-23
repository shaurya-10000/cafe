import { memo } from "react";

import { motion, useReducedMotion } from "framer-motion";

import {
  CouponInput,
  type AppliedCoupon,
} from "@/components/GamesAndRewards";
import type { CartItem } from "@/types/cart";

import { getViewSlide, getViewTransition } from "../lib/motion";
import type { FavoriteDisplayItem } from "../types";
import { CartItemRow } from "./CartItemRow";
import { EmptyCart } from "./EmptyCart";
import { FavoritesQuickAdd } from "./FavoritesQuickAdd";

interface CartViewProps {
  items: CartItem[];
  favoriteItems: readonly FavoriteDisplayItem[];
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  onRemoveOne: (id: string) => void | Promise<void>;
  onRemoveAll: (id: string) => void | Promise<void>;
  onAddFavorite: (item: FavoriteDisplayItem) => void;
  onCouponApply: (coupon: AppliedCoupon) => void;
  onCouponRemove: () => void;
}

export const CartView = memo(function CartView({
  items,
  favoriteItems,
  subtotal,
  appliedCoupon,
  onRemoveOne,
  onRemoveAll,
  onAddFavorite,
  onCouponApply,
  onCouponRemove,
}: CartViewProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      {...getViewSlide("left", reducedMotion)}
      transition={getViewTransition(reducedMotion)}
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="sidebar-scroll flex-1 space-y-4 overflow-y-auto p-6">
        {items.length > 0 ? (
          items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onRemoveOne={onRemoveOne}
              onRemoveAll={onRemoveAll}
            />
          ))
        ) : (
          <EmptyCart />
        )}
      </div>

      {favoriteItems.length > 0 && (
        <FavoritesQuickAdd items={favoriteItems} onAdd={onAddFavorite} />
      )}

      {items.length > 0 && (
        <div className="shrink-0 border-t border-[#EAE9E4] bg-[#FAF9F6] px-6 pb-4 pt-3 dark:border-white/5 dark:bg-black">
          <CouponInput
            subtotal={subtotal}
            appliedCoupon={appliedCoupon}
            onApply={onCouponApply}
            onRemove={onCouponRemove}
          />
        </div>
      )}
    </motion.div>
  );
});
