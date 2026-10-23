"use client";

import { useMemo } from "react";

import { CouponFormModal } from "./components/CouponFormModal";
import { CouponList } from "./components/CouponList";
import { CouponsHeader } from "./components/CouponsHeader";
import { GameRewardCard } from "./components/GameRewardCard";
import { useAiCouponActions } from "./hooks/useAiCouponActions";
import { useCouponActions } from "./hooks/useCouponActions";
import { useCouponForm } from "./hooks/useCouponForm";
import { useCoupons } from "./hooks/useCoupons";
import { useGameReward } from "./hooks/useGameReward";
import { countRedeemable } from "./lib/coupons";

export function CouponsTab() {
  const { coupons, loading, refresh } = useCoupons();

  const gameReward = useGameReward();
  const couponForm = useCouponForm({ onSaved: refresh });
  const actions = useCouponActions({ onChanged: refresh });

  // AI concierge: "disable the SAVE20 coupon", "change the welcome reward".
  useAiCouponActions({
    coupons,
    toggleCoupon: actions.toggle,
    saveGameReward: gameReward.save,
  });

  const redeemable = useMemo(() => countRedeemable(coupons), [coupons]);

  return (
    <div className="space-y-8">
      <GameRewardCard state={gameReward} />

      <CouponsHeader
        total={coupons.length}
        redeemable={redeemable}
        onCreate={couponForm.openCreate}
      />

      {couponForm.isOpen && (
        <CouponFormModal
          isEditing={couponForm.isEditing}
          values={couponForm.values}
          error={couponForm.error}
          submitting={couponForm.submitting}
          onFieldChange={couponForm.setField}
          onCancel={couponForm.close}
          onSubmit={() => void couponForm.submit()}
        />
      )}

      <CouponList
        coupons={coupons}
        loading={loading}
        togglingId={actions.togglingId}
        onToggle={actions.toggle}
        onEdit={couponForm.openEdit}
        onDelete={actions.remove}
      />
    </div>
  );
}
