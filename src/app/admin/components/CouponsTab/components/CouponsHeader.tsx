import { memo } from "react";

import { Plus } from "lucide-react";

interface CouponsHeaderProps {
  total: number;
  redeemable: number;
  onCreate: () => void;
}

export const CouponsHeader = memo(function CouponsHeader({
  total,
  redeemable,
  onCreate,
}: CouponsHeaderProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          Standard Checkout Coupons
        </h2>

        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {total} total &middot; {redeemable} active
        </p>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="flex items-center gap-2 rounded-xl bg-[#C5A059] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#A67C00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] focus-visible:ring-offset-2"
      >
        <Plus size={14} aria-hidden="true" />
        New Coupon
      </button>
    </div>
  );
});
