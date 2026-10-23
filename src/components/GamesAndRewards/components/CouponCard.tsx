import { AnimatePresence, motion } from "framer-motion";
import { getItemVariants } from "../lib/motion";
import type { ClaimedReward, GameRewardConfig } from "../types";
import { ClaimedCouponView } from "./ClaimedCouponView";
import { UnclaimedCouponView } from "./UnclaimedCouponView";

interface CouponCardProps {
  readonly isLoggedIn: boolean;
  readonly claimedReward: ClaimedReward | null;
  readonly rewardConfig: GameRewardConfig | null;
  readonly configLoading: boolean;
  readonly isClaimable: boolean;
  readonly isClaiming: boolean;
  readonly copied: boolean;
  readonly onClaim: () => void;
  readonly onCopy: () => void;
  readonly onSignIn: () => void;
  readonly reducedMotion: boolean;
}

export function CouponCard({
  isLoggedIn,
  claimedReward,
  rewardConfig,
  configLoading,
  isClaimable,
  isClaiming,
  copied,
  onClaim,
  onCopy,
  onSignIn,
  reducedMotion,
}: CouponCardProps) {
  return (
    <motion.div
      variants={getItemVariants(reducedMotion)}
      className="relative w-full rounded-[40px] border border-[#EAE9E4] bg-[#F5F5F1] p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 md:p-14"
    >
      <AnimatePresence mode="wait">
        {claimedReward ? (
          <ClaimedCouponView
            key="claimed"
            reward={claimedReward}
            copied={copied}
            onCopy={onCopy}
            reducedMotion={reducedMotion}
          />
        ) : (
          <UnclaimedCouponView
            key="unclaimed"
            isLoggedIn={isLoggedIn}
            configLoading={configLoading}
            config={rewardConfig}
            isClaimable={isClaimable}
            isClaiming={isClaiming}
            onClaim={onClaim}
            onSignIn={onSignIn}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
