import { memo, useMemo } from "react";

import { Loader2, Tag } from "lucide-react";

import type { Coupon } from "@/app/admin/actions/couponActions";

import { splitCoupons } from "../lib/coupons";
import { CouponRow } from "./CouponRow";

interface CouponListProps {
  coupons: Coupon[];
  loading: boolean;
  togglingId: string | null;
  onToggle: (coupon: Coupon) => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

export const CouponList = memo(function CouponList({
  coupons,
  loading,
  togglingId,
  onToggle,
  onEdit,
  onDelete,
}: CouponListProps) {
  const { active, inactive } = useMemo(() => splitCoupons(coupons), [coupons]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          size={24}
          className="animate-spin text-[#C5A059]"
          aria-hidden="true"
        />

        <span className="sr-only">Loading coupons&hellip;</span>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 py-20 text-center dark:border-white/5">
        <Tag
          size={32}
          className="mx-auto mb-3 text-zinc-400"
          strokeWidth={1.5}
          aria-hidden="true"
        />

        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          No coupons yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {active.map((coupon) => (
          <CouponRow
            key={coupon.id}
            coupon={coupon}
            variant="active"
            isToggling={togglingId === coupon.id}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {inactive.length > 0 && (
        <div className="space-y-3 border-t border-zinc-200 pt-6 dark:border-white/5">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Disabled Coupons ({inactive.length})
          </p>

          {inactive.map((coupon) => (
            <CouponRow
              key={coupon.id}
              coupon={coupon}
              variant="inactive"
              isToggling={togglingId === coupon.id}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});
