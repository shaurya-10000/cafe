"use client";

import { useUser } from "@clerk/nextjs";

import {
  ActiveSection,
  ArchiveSection,
  EmptyState,
  LoadingState,
} from "./components";
import { useCopyFeedback, useCouponBuckets, useCoupons } from "./hooks";
import { ROOT_CLASS } from "./styles";

/**
 * Customer coupons: admin-defined coupons plus claimed game rewards, split
 * into Available and an archive of expired / used coupons.
 */
export function CouponsTab() {
  const { user } = useUser();

  const { coupons, unavailableCodes, loading } = useCoupons(user?.id);
  const { active, archived } = useCouponBuckets(coupons, unavailableCodes);
  const { copiedId, copy } = useCopyFeedback();

  if (loading) return <LoadingState />;
  if (coupons.length === 0) return <EmptyState />;

  return (
    <div className={ROOT_CLASS}>
      <ActiveSection coupons={active} copiedId={copiedId} onCopy={copy} />
      <ArchiveSection coupons={archived} />
    </div>
  );
}