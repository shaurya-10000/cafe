"use client";

import { useCallback, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CouponCard } from "./components/CouponCard";
import { GuestSignUpModal } from "./components/GuestSignUpModal";
import { RewardsHeader } from "./components/RewardsHeader";
import { MESSAGES, REWARD_SECTION_ID } from "./constants";
import { useClaimedReward } from "./hooks/useClaimedReward";
import { useCopyFeedback } from "./hooks/useCopyFeedback";
import { useOpenRewardEvent } from "./hooks/useOpenRewardEvent";
import { useRewardConfig } from "./hooks/useRewardConfig";
import { containerVariants } from "./lib/motion";
import type { GamesAndRewardsProps } from "./types";

export default function GamesAndRewards({
  isAuthenticated,
  onSignUpClick,
}: GamesAndRewardsProps) {
  const { user } = useUser();
  const router = useRouter();
  const reducedMotion = useReducedMotion() ?? false;

  const instanceId = useId();
  const headingId = `${instanceId}-heading`;
  const modalTitleId = `${instanceId}-modal-title`;

  const isLoggedIn = isAuthenticated ?? !!user;
  const userId = isLoggedIn ? (user?.id ?? null) : null;

  const { config: rewardConfig, loading: configLoading } =
    useRewardConfig(isLoggedIn);
  const { claimedReward, claimChecked, isClaiming, claim } = useClaimedReward({
    userId,
    rewardConfig,
  });
  const { copied, copy } = useCopyFeedback();

  const [showModal, setShowModal] = useState(false);
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  useOpenRewardEvent({ isLoggedIn, reducedMotion, onRequireAuth: openModal });

  const handleClaim = useCallback(async () => {
    const outcome = await claim();
    if (outcome === "claimed") toast.success(MESSAGES.claimSuccess);
    else if (outcome === "failed") toast.error(MESSAGES.claimFailed);
  }, [claim]);

  const handleCopy = useCallback(async () => {
    if (!claimedReward) return;
    const result = await copy(claimedReward.promo_code);
    if (result === "denied") toast.error(MESSAGES.copyDenied);
    else if (result === "unsupported") toast.error(MESSAGES.copyUnsupported);
  }, [claimedReward, copy]);

  const handleAuthRedirect = useCallback(() => {
    setShowModal(false);
    if (onSignUpClick) onSignUpClick();
    else router.push("/sign-in");
  }, [onSignUpClick, router]);

  /*
   * `game_rewards_public` only lists active rewards, so for a signed-in user a
   * missing config means "unavailable": hide the section unless they already
   * hold a claimed code. `requires_play` rewards are claimed through the game
   * flow, which this component no longer renders, so those are hidden too.
   */
  const isClaimed = claimedReward !== null;
  const isClaimable = rewardConfig !== null && !rewardConfig.requires_play;
  const showCard =
    !isLoggedIn || configLoading || !claimChecked || isClaimed || isClaimable;

  return (
    <section
      id={REWARD_SECTION_ID}
      aria-labelledby={headingId}
      className="overflow-hidden border-t border-[#EAE9E4] bg-[#FAF9F6] px-6 py-32 dark:border-zinc-900 dark:bg-black"
    >
      <motion.div
        initial={reducedMotion ? false : "hidden"}
        whileInView={reducedMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="mx-auto max-w-7xl space-y-20"
      >
        <RewardsHeader
          headingId={headingId}
          isLoggedIn={isLoggedIn}
          isClaimed={isClaimed}
          reducedMotion={reducedMotion}
        />

        {showCard && (
          <CouponCard
            isLoggedIn={isLoggedIn}
            claimedReward={claimedReward}
            rewardConfig={rewardConfig}
            configLoading={configLoading}
            isClaimable={isClaimable}
            isClaiming={isClaiming}
            copied={copied}
            onClaim={() => void handleClaim()}
            onCopy={() => void handleCopy()}
            onSignIn={openModal}
            reducedMotion={reducedMotion}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <GuestSignUpModal
            key="guest-sign-up-modal"
            titleId={modalTitleId}
            reducedMotion={reducedMotion}
            onClose={closeModal}
            onConfirm={handleAuthRedirect}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
