import { motion } from "framer-motion";
import { CheckCircle2, Copy } from "lucide-react";
import { getScaleFadeMotion } from "../lib/motion";
import type { ClaimedReward } from "../types";

interface ClaimedCouponViewProps {
  readonly reward: ClaimedReward;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly reducedMotion: boolean;
}

export function ClaimedCouponView({
  reward,
  copied,
  onCopy,
  reducedMotion,
}: ClaimedCouponViewProps) {
  return (
    <motion.div
      key="claimed"
      {...getScaleFadeMotion(reducedMotion)}
      className="mx-auto max-w-lg space-y-5 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
        <CheckCircle2 size={28} aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          Coupon Claimed
        </span>
        <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          {reward.title}
        </h3>
        {reward.discount_value && (
          <p className="text-sm font-bold text-cafe-accent">
            {reward.discount_value} off
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onCopy}
        aria-label={
          copied ? "Coupon code copied" : `Copy coupon code ${reward.promo_code}`
        }
        className="inline-flex items-center gap-2 rounded-xl border border-cafe-accent/20 bg-cafe-accent/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-cafe-accent transition-colors hover:bg-cafe-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2"
      >
        {copied ? (
          <>
            <CheckCircle2 size={14} aria-hidden="true" /> Copied!
          </>
        ) : (
          <>
            <Copy size={14} aria-hidden="true" /> {reward.promo_code}
          </>
        )}
      </button>

      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        Find this anytime in your Coupons tab
      </p>
    </motion.div>
  );
}
