import { memo } from "react";

interface OrderTotalsProps {
  subtotal: number;
  discountAmount: number;
  couponCode: string | undefined;
  total: number;
  formatPrice: (value: number) => string;
}

export const OrderTotals = memo(function OrderTotals({
  subtotal,
  discountAmount,
  couponCode,
  total,
  formatPrice,
}: OrderTotalsProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
          Subtotal
        </span>

        <span className="text-sm font-bold text-zinc-500">
          {formatPrice(subtotal)}
        </span>
      </div>

      {discountAmount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">
            Discount ({couponCode ?? ""})
          </span>

          <span className="text-sm font-bold text-emerald-500">
            -{formatPrice(discountAmount)}
          </span>
        </div>
      )}

      <div className="flex items-end justify-between border-t border-[#EAE9E4] pt-1 dark:border-white/5">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
          Net Total
        </span>

        <span className="text-4xl font-black italic tracking-tighter text-[#C5A059]">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
});
