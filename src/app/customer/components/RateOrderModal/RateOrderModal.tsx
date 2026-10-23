"use client";

import { useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import { useSupabaseClient } from "@/utils/supabase/client";

import { ModalBody, ModalHeader } from "./components";
import {
  BACKDROP_FADE_S,
  DIALOG_HIDDEN,
  DIALOG_HIDDEN_REDUCED,
  DIALOG_SPRING,
  DIALOG_VISIBLE,
} from "./constants";
import { useDialogBehavior, useRatableOrder, useReviewForm } from "./hooks";
import {
  BACKDROP_CLASS,
  DIALOG_CLASS,
  DIALOG_WRAPPER_CLASS,
} from "./styles";
import type { RateOrderModalProps } from "./types";

/**
 * Rate-order modal. Replaces the old standalone /rate/[orderId] page.
 *
 * Mount/unmount is driven by the parent (`{ratingOrderId && <RateOrderModal />}`).
 * Wrap that conditional in the parent's own <AnimatePresence> for the exit
 * animation to play; this component has no internal open/closed state.
 */
export default function RateOrderModal({
  orderId,
  onClose,
  onSubmitted,
}: RateOrderModalProps) {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const userId = user?.id;
  const shouldReduceMotion = useReducedMotion() ?? false;
  const isMountedRef = useIsMountedRef();

  const dialogRef = useDialogBehavior(onClose);
  const { loadState, ratableItems } = useRatableOrder({
    supabase,
    userId,
    orderId,
    isMountedRef,
  });
  const form = useReviewForm({
    supabase,
    userId,
    orderId,
    items: ratableItems,
    onSubmitted,
    onClose,
    isMountedRef,
  });

  // The dialog stops propagation, so a click that reaches the wrapper is a
  // genuine backdrop click.
  const handleDialogClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => event.stopPropagation(),
    [],
  );

  const dialogTransition = useMemo(
    () => (shouldReduceMotion ? { duration: 0 } : DIALOG_SPRING),
    [shouldReduceMotion],
  );

  const hidden = shouldReduceMotion ? DIALOG_HIDDEN_REDUCED : DIALOG_HIDDEN;

  return createPortal(
    <>
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : BACKDROP_FADE_S }}
        onClick={onClose}
        aria-hidden="true"
        className={BACKDROP_CLASS}
      />
      <motion.div
        initial={hidden}
        animate={DIALOG_VISIBLE}
        exit={hidden}
        transition={dialogTransition}
        className={DIALOG_WRAPPER_CLASS}
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Rate your order"
          tabIndex={-1}
          onClick={handleDialogClick}
          className={DIALOG_CLASS}
        >
          <ModalHeader orderId={orderId} onClose={onClose} />
          <ModalBody
            loadState={loadState}
            ratableItems={ratableItems}
            form={form}
          />
        </div>
      </motion.div>
    </>,
    document.body,
  );
}