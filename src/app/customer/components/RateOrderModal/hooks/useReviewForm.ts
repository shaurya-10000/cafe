"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MountedRef } from "@/hooks/useIsMountedRef";

import { SUCCESS_AUTO_CLOSE_MS } from "../constants";
import { buildReviewRows, getSubmitErrorMessage } from "../lib/reviews";
import type {
  ModalSupabaseClient,
  OrderLineItem,
  RatingMap,
  RemarkMap,
  ReviewFormState,
} from "../types";

interface UseReviewFormOptions {
  supabase: ModalSupabaseClient;
  userId: string | undefined;
  orderId: string;
  items: readonly OrderLineItem[];
  onSubmitted?: () => void;
  onClose: () => void;
  isMountedRef: MountedRef;
}

export function useReviewForm({
  supabase,
  userId,
  orderId,
  items,
  onSubmitted,
  onClose,
  isMountedRef,
}: UseReviewFormOptions): ReviewFormState {
  const [ratings, setRatings] = useState<RatingMap>({});
  const [remarks, setRemarks] = useState<RemarkMap>({});
  const [hoveredStar, setHoveredStar] = useState<RatingMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current !== null) {
        clearTimeout(autoCloseTimeoutRef.current);
        autoCloseTimeoutRef.current = null;
      }
    };
  }, []);

  const setRating = useCallback((catalogItemId: string, star: number) => {
    setRatings((prev) => ({ ...prev, [catalogItemId]: star }));
  }, []);

  const setRemark = useCallback((catalogItemId: string, text: string) => {
    setRemarks((prev) => ({ ...prev, [catalogItemId]: text }));
  }, []);

  const setHover = useCallback((catalogItemId: string, star: number) => {
    setHoveredStar((prev) => ({ ...prev, [catalogItemId]: star }));
  }, []);

  const submit = useCallback(async () => {
    if (!userId || items.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const rows = buildReviewRows({ orderId, userId, items, ratings, remarks });
    const { error } = await supabase.from("reviews").insert(rows);

    if (!isMountedRef.current) return;

    if (error) {
      setErrorMessage(getSubmitErrorMessage(error));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsFinished(true);
    onSubmitted?.();

    if (autoCloseTimeoutRef.current !== null) {
      clearTimeout(autoCloseTimeoutRef.current);
    }
    autoCloseTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      autoCloseTimeoutRef.current = null;
      onClose();
    }, SUCCESS_AUTO_CLOSE_MS);
  }, [
    userId,
    items,
    orderId,
    ratings,
    remarks,
    supabase,
    onSubmitted,
    onClose,
    isMountedRef,
  ]);

  return {
    ratings,
    remarks,
    hoveredStar,
    isSubmitting,
    isFinished,
    errorMessage,
    setRating,
    setRemark,
    setHover,
    submit,
  };
}