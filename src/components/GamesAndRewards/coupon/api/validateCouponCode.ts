/**
 * Imported lazily so the rest of this module (GamesAndRewards) doesn't drag
 * the server-action module into the client bundle for users who never open
 * the checkout sidebar.
 */
export async function validateCouponCode(code: string, subtotal: number) {
  const { validateCoupon } = await import("@/app/admin/actions/couponActions");
  return validateCoupon(code, subtotal);
}
