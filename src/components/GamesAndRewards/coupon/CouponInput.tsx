"use client";

import { useId } from "react";
import { AppliedCouponBanner } from "./components/AppliedCouponBanner";
import { CouponForm } from "./components/CouponForm";
import { useCouponInput } from "./hooks/useCouponInput";
import type { CouponInputProps } from "./types";

export function CouponInput({
  subtotal,
  appliedCoupon,
  onApply,
  onRemove,
}: CouponInputProps) {
  const errorId = useId();
  const { code, loading, error, changeCode, submit, remove } = useCouponInput({
    subtotal,
    onApply,
    onRemove,
  });

  if (appliedCoupon) {
    return <AppliedCouponBanner coupon={appliedCoupon} onRemove={remove} />;
  }

  return (
    <CouponForm
      errorId={errorId}
      code={code}
      loading={loading}
      error={error}
      onChange={changeCode}
      onSubmit={submit}
    />
  );
}
