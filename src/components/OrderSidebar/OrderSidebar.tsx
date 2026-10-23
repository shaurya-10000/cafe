"use client";

import { useCallback, useMemo } from "react";

import { createPortal } from "react-dom";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useUser } from "@clerk/nextjs";

import { CartView } from "./components/CartView";
import { OptionsView } from "./components/OptionsView";
import { SidebarFooter } from "./components/SidebarFooter";
import { SidebarHeader } from "./components/SidebarHeader";
import { SidebarScrollbarStyles } from "./components/SidebarScrollbarStyles";
import { EMPTY_FAVORITE_IDS } from "./constants";
import { useBusinessCurrency } from "./hooks/useBusinessCurrency";
import { useCheckoutForm } from "./hooks/useCheckoutForm";
import { useCheckoutSubmit } from "./hooks/useCheckoutSubmit";
import { useCouponState } from "./hooks/useCouponState";
import { useEscapeKey } from "./hooks/useEscapeKey";
import { useFavoriteCatalogItems } from "./hooks/useFavoriteCatalogItems";
import { useHasMounted } from "./hooks/useHasMounted";
import { useSidebarView } from "./hooks/useSidebarView";
import { useCafeEvents } from "./hooks/useCafeEvents";
import { calculateSubtotal } from "./lib/cart";
import { dispatchCouponInputApply } from "./lib/events";
import { createPriceFormatter } from "./lib/format";
import { getPanelTransition } from "./lib/motion";
import type {
  CheckoutPrefillDetail,
  FavoriteDisplayItem,
  OrderSidebarProps,
} from "./types";

export default function OrderSidebar({
  isOpen,
  onClose,
  items,
  onRemoveOne,
  onRemoveAll,
  onClear,
  favoriteIds = EMPTY_FAVORITE_IDS,
  onAddItem,
}: OrderSidebarProps) {
  const { user } = useUser();
  const reducedMotion = useReducedMotion() ?? false;

  const mounted = useHasMounted();

  /* ---- Data -------------------------------------------------------------- */

  const currency = useBusinessCurrency(isOpen);

  const formatPrice = useMemo(
    () => createPriceFormatter(currency),
    [currency],
  );

  const favoriteCatalogItems = useFavoriteCatalogItems({
    enabled: isOpen,
    favoriteIds,
  });

  const favoriteItems = useMemo<FavoriteDisplayItem[]>(
    () =>
      favoriteCatalogItems.map((item) => ({
        ...item,
        priceLabel: formatPrice(item.numeric_price),
      })),
    [favoriteCatalogItems, formatPrice],
  );

  const subtotal = useMemo(() => calculateSubtotal(items), [items]);

  /* ---- State ------------------------------------------------------------- */

  const form = useCheckoutForm(user?.fullName || user?.username || null);
  const coupon = useCouponState(subtotal);
  const sidebar = useSidebarView({ isOpen, onClose });

  const checkout = useCheckoutSubmit({
    items,
    values: form.values,
    couponCode: coupon.appliedCoupon?.code,
  });

  /* ---- Window events from the Cafe assistant --------------------------- */

  const { applyPrefill } = form;
  const { showCart, showOptions } = sidebar;

  const handlePrefillCheckout = useCallback(
    (detail: CheckoutPrefillDetail | undefined) => {
      if (detail) applyPrefill(detail);
      showOptions();
    },
    [applyPrefill, showOptions],
  );

  const handleApplyCoupon = useCallback(
    (code: string) => {
      showCart();

      // Wait one frame so the cart view is mounted before the CouponInput
      // listener is live.
      requestAnimationFrame(() => {
        dispatchCouponInputApply(code);
      });
    },
    [showCart],
  );

  useCafeEvents({
    onPrefillCheckout: handlePrefillCheckout,
    onApplyCoupon: handleApplyCoupon,
  });

  useEscapeKey(isOpen, sidebar.close);

  /* ---- Actions ----------------------------------------------------------- */

  const handleAddFavorite = useCallback(
    (favorite: FavoriteDisplayItem) => {
      void onAddItem?.({
        id: favorite.id,
        name: favorite.name,
        price: favorite.priceLabel,
        numeric_price: favorite.numeric_price,
      });
    },
    [onAddItem],
  );

  const { submit } = checkout;

  const handlePrimaryAction = useCallback(() => {
    if (sidebar.view === "cart") {
      showOptions();
      return;
    }

    void submit();
  }, [showOptions, sidebar.view, submit]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <SidebarScrollbarStyles />

          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            onClick={sidebar.close}
            aria-hidden="true"
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            transition={getPanelTransition(reducedMotion)}
            role="dialog"
            aria-modal="true"
            aria-label="Order sidebar"
            className="fixed right-0 top-0 z-[9999] flex h-full w-full max-w-md flex-col border-l border-[#EAE9E4] bg-[#FAF9F6] shadow-2xl dark:border-white/5 dark:bg-black"
          >
            <SidebarHeader
              view={sidebar.view}
              hasItems={items.length > 0}
              headingRef={sidebar.headingRef}
              onBack={showCart}
              onClear={onClear}
              onClose={sidebar.close}
            />

            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {sidebar.view === "cart" ? (
                  <CartView
                    key="cart"
                    items={items}
                    favoriteItems={favoriteItems}
                    subtotal={subtotal}
                    appliedCoupon={coupon.appliedCoupon}
                    onRemoveOne={onRemoveOne}
                    onRemoveAll={onRemoveAll}
                    onAddFavorite={handleAddFavorite}
                    onCouponApply={coupon.applyCoupon}
                    onCouponRemove={coupon.removeCoupon}
                  />
                ) : (
                  <OptionsView
                    key="options"
                    values={form.values}
                    setField={form.setField}
                  />
                )}
              </AnimatePresence>
            </div>

            <SidebarFooter
              view={sidebar.view}
              subtotal={subtotal}
              discountAmount={coupon.discountAmount}
              couponCode={coupon.appliedCoupon?.code}
              total={coupon.displayTotal}
              canSubmit={items.length > 0}
              loading={checkout.loading}
              formatPrice={formatPrice}
              onPrimaryAction={handlePrimaryAction}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
