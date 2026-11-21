import { memo } from "react";

import type { View } from "../types";
import { CheckoutButton } from "./CheckoutButton";
import { OrderTotals } from "./OrderTotals";

interface SidebarFooterProps {
  view: View;
  subtotal: number;
  discountAmount: number;
  couponCode: string | undefined;
  total: number;
  canSubmit: boolean;
  isStoreOpen?: boolean;
  loading: boolean;
  formatPrice: (value: number) => string;
  onPrimaryAction: () => void;
}

export const SidebarFooter = memo(function SidebarFooter({
  view,
  subtotal,
  discountAmount,
  couponCode,
  total,
  canSubmit,
  isStoreOpen = true,
  loading,
  formatPrice,
  onPrimaryAction,
}: SidebarFooterProps) {
  return (
    <div className="z-30 shrink-0 space-y-6 border-t border-[#EAE9E4] bg-[#FAF9F6] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] dark:border-white/5 dark:bg-black">
      {!isStoreOpen && (
        <div
          role="status"
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-red-500"
        >
          Cafe is currently closed — checkout paused
        </div>
      )}

      <OrderTotals
        subtotal={subtotal}
        discountAmount={discountAmount}
        couponCode={couponCode}
        total={total}
        formatPrice={formatPrice}
      />

      <CheckoutButton
        view={view}
        disabled={!canSubmit || !isStoreOpen}
        loading={loading}
        onClick={onPrimaryAction}
      />
    </div>
  );
});
