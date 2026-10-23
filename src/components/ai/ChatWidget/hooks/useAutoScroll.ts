"use client";

import { useEffect, useRef } from "react";

import type { Message } from "@/components/ai/types";

interface UseAutoScrollOptions {
  messages: readonly Message[] | undefined;
  loading: boolean;
  slotHint: string | null;
  reducedMotion: boolean;
}

/** Keeps the end of the conversation in view; returns the ref to place there. */
export function useAutoScroll({
  messages,
  loading,
  slotHint,
  reducedMotion,
}: UseAutoScrollOptions) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [messages, loading, slotHint, reducedMotion]);

  return endRef;
}