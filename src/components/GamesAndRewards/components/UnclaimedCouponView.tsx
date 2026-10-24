import { motion } from "framer-motion";
import { Gift, Loader2 } from "lucide-react";
import { getFadeMotion } from "../lib/motion";
import type { GameRewardConfig } from "../types";
import { ScratchCard } from "./ScratchCard";

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
  const mode = !isLoggedIn
    ? "locked"
    : isClaimable && !configLoading && !isClaiming
      ? "ready"
      : "disabled";

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
            ? "Scratch the card to reveal and claim your coupon."
            : "Sign in to scratch and claim your welcome coupon."}
        </p>
      </div>

      <ScratchCard
        mode={mode}
        isClaiming={isClaiming}
        onReveal={onClaim}
        onLockedPress={onSignIn}
        fallbackLabel={
          isLoggedIn ? "Prefer not to scratch? Reveal instead" : "Sign in to claim"
        }
      >
        {isLoggedIn && config ? (
          <>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cafe-accent">
              You won
            </span>
            <span className="text-6xl font-black tracking-tight sm:text-7xl text-zinc-900 dark:text-zinc-100">
              {config.discount_value}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              off your order
            </span>
          </>
        ) : (
          <>
            <Gift size={28} className="text-cafe-accent" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Your welcome reward
            </span>
          </>
        )}
      </ScratchCard>

      {isClaiming && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cafe-accent"
        >
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Claiming&hellip;
        </p>
      )}
    </motion.div>
  );
}