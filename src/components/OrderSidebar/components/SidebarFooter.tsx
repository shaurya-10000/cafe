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
  loading,
  formatPrice,
  onPrimaryAction,
}: SidebarFooterProps) {
  return (
    <div className="z-30 shrink-0 space-y-6 border-t border-[#EAE9E4] bg-[#FAF9F6] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] dark:border-white/5 dark:bg-black">
      <OrderTotals
        subtotal={subtotal}
        discountAmount={discountAmount}
        couponCode={couponCode}
        total={total}
        formatPrice={formatPrice}
      />

      <CheckoutButton
        view={view}
        disabled={!canSubmit}
        loading={loading}
        onClick={onPrimaryAction}
      />
    </div>
  );
});
