export interface AppliedCoupon {
  couponId: string;
  code: string;
  discountAmount: number;
  finalTotal: number;
}

export interface CouponInputProps {
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}
