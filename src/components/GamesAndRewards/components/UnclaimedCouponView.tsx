import { motion } from "framer-motion";
import { Gift, Loader2 } from "lucide-react";
import { getFadeMotion } from "../lib/motion";
import type { GameRewardConfig } from "../types";

interface UnclaimedCouponViewProps {
  readonly isLoggedIn: boolean;
  readonly configLoading: boolean;
  readonly config: GameRewardConfig | null;
  readonly isClaimable: boolean;
  readonly isClaiming: boolean;
  readonly onClaim: () => void;
  readonly onSignIn: () => void;
  readonly reducedMotion: boolean;
}

function getTitle(
  isLoggedIn: boolean,
  configLoading: boolean,
  config: GameRewardConfig | null,
): string {
  if (!isLoggedIn) return "Unlock Your Welcome Coupon";
  if (configLoading) return "Loading\u2026";
  return config?.title ?? "Welcome Reward";
}

export function UnclaimedCouponView({
  isLoggedIn,
  configLoading,
  config,
  isClaimable,
  isClaiming,
  onClaim,
  onSignIn,
  reducedMotion,
}: UnclaimedCouponViewProps) {
  return (
    <motion.div
      key="unclaimed"
      {...getFadeMotion(reducedMotion)}
      className="mx-auto max-w-2xl space-y-8 text-center"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-cafe-accent/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-cafe-accent">
        <Gift size={14} aria-hidden="true" /> Welcome Offer
      </div>

      <div className="space-y-3">
        <h3 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
          {getTitle(isLoggedIn, configLoading, config)}
        </h3>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 md:text-sm">
          {isLoggedIn
            ? "Claim your coupon below."
            : "Sign in to claim your welcome coupon."}
        </p>
        {isLoggedIn && config && (
          <p className="text-sm font-black text-cafe-accent">
            {config.discount_value} off
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={isLoggedIn ? onClaim : onSignIn}
        disabled={isLoggedIn && (!isClaimable || isClaiming)}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-black"
      >
        {isClaiming ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Claiming&hellip;
          </>
        ) : (
          <>
            <Gift size={16} aria-hidden="true" />
            {isLoggedIn ? "Claim Coupon" : "Sign In to Claim"}
          </>
        )}
      </button>
    </motion.div>
  );
}
