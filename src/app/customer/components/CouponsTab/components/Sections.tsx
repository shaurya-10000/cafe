import { Archive } from "lucide-react";

import {
  ARCHIVE_SECTION_CLASS,
  EMPTY_SECTION_CLASS,
  EMPTY_TEXT_CLASS,
  SECTION_CLASS,
  SECTION_TITLE_CLASS,
} from "../styles";
import type { Coupon } from "../types";
import { ActiveCouponCard } from "./ActiveCouponCard";
import { ArchivedCouponCard } from "./ArchivedCouponCard";

interface ActiveSectionProps {
  coupons: readonly Coupon[];
  copiedId: string | null;
  onCopy: (coupon: Coupon) => void;
}

export function ActiveSection({ coupons, copiedId, onCopy }: ActiveSectionProps) {
  return (
    <div className={SECTION_CLASS}>
      <p className={`mb-6 ${SECTION_TITLE_CLASS}`}>
        Available Coupons ({coupons.length})
      </p>

      {coupons.length === 0 ? (
        <div className={EMPTY_SECTION_CLASS}>
          <p className={EMPTY_TEXT_CLASS}>
            No active coupons available right now
          </p>
        </div>
      ) : (
        coupons.map((coupon) => (
          <ActiveCouponCard
            key={coupon.id}
            coupon={coupon}
            justCopied={copiedId === coupon.id}
            onCopy={onCopy}
          />
        ))
      )}
    </div>
  );
}

export function ArchiveSection({ coupons }: { coupons: readonly Coupon[] }) {
  if (coupons.length === 0) return null;

  return (
    <div className={ARCHIVE_SECTION_CLASS}>
      <div className="mb-6 flex items-center gap-2">
        <Archive size={14} className="text-gray-500" aria-hidden="true" />
        <p className={SECTION_TITLE_CLASS}>
          Expired &amp; Used Coupons ({coupons.length})
        </p>
      </div>

      {coupons.map((coupon) => (
        <ArchivedCouponCard key={coupon.id} coupon={coupon} />
      ))}
    </div>
  );
}