import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getItemVariants } from "../lib/motion";

interface RewardStatusBadgeProps {
  readonly isLoggedIn: boolean;
  readonly isClaimed: boolean;
  readonly reducedMotion: boolean;
}

function getStatusLabel(isLoggedIn: boolean, isClaimed: boolean): string {
  if (!isLoggedIn) return "Guest Pass";
  return isClaimed ? "Coupon Claimed" : "Ready to Claim";
}

export function RewardStatusBadge({
  isLoggedIn,
  isClaimed,
  reducedMotion,
}: RewardStatusBadgeProps) {
  return (
    <motion.div
      variants={getItemVariants(reducedMotion)}
      className="flex items-center justify-start gap-6 border-t border-[#EAE9E4] pt-6 dark:border-zinc-900 lg:col-span-5 lg:justify-end lg:border-t-0"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[#EAE9E4] bg-[#F5F5F1] p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-accent/10 text-cafe-accent">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <div>
          <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Status
          </span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {getStatusLabel(isLoggedIn, isClaimed)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
