import { motion } from "framer-motion";
import { getItemVariants } from "../lib/motion";
import { RewardStatusBadge } from "./RewardStatusBadge";

interface RewardsHeaderProps {
  readonly headingId: string;
  readonly isLoggedIn: boolean;
  readonly isClaimed: boolean;
  readonly reducedMotion: boolean;
}

export function RewardsHeader({
  headingId,
  isLoggedIn,
  isClaimed,
  reducedMotion,
}: RewardsHeaderProps) {
  return (
    <div className="grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
      <motion.div
        variants={getItemVariants(reducedMotion)}
        className="space-y-6 lg:col-span-7"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cafe-accent">
          Perks
        </p>
        <h2
          id={headingId}
          className="text-6xl font-black uppercase leading-[0.8] tracking-tighter text-zinc-900 dark:text-zinc-100 md:text-8xl"
        >
          Your <br />
          <span className="font-serif lowercase italic text-cafe-accent">
            Exclusive
          </span>{" "}
          <br />
          Rewards.
        </h2>
        <p className="max-w-md pt-2 text-lg font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
          Claim your welcome coupon and find it anytime in your coupons tab.
        </p>
      </motion.div>

      <RewardStatusBadge
        isLoggedIn={isLoggedIn}
        isClaimed={isClaimed}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
