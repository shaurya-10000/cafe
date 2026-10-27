"use client";

import { useEffect, useRef } from "react";

import type { Message } from "@/components/ai/types";

interface UseAutoScrollOptions {
  isOpen: boolean;
  activeChatId: string | null;
  messages: readonly Message[] | undefined;
  loading: boolean;
  slotHint: string | null;
  reducedMotion: boolean;
}

/**
 * Keeps the end of the conversation in view; returns the ref to place there.
 *
 * The message list is unmounted while the widget is closed, so reopening it
 * (or switching chats) jumps straight to the latest message. New messages
 * while it is open scroll smoothly.
 */
export function useAutoScroll({
  isOpen,
  activeChatId,
  messages,
  loading,
  slotHint,
  reducedMotion,
}: UseAutoScrollOptions) {
  const endRef = useRef<HTMLDivElement>(null);

  // True until the next scroll has happened for a fresh view.
  const jumpRef = useRef(true);

  useEffect(() => {
    if (!isOpen) jumpRef.current = true;
  }, [isOpen]);

  useEffect(() => {
    jumpRef.current = true;
  }, [activeChatId]);

  useEffect(() => {
    if (!isOpen) return;

    const instant = jumpRef.current;
    jumpRef.current = false;

    endRef.current?.scrollIntoView({
      behavior: instant || reducedMotion ? "auto" : "smooth",
      block: "end",
    });

    if (!instant) return;

    // Once the panel has been laid out, scroll again so the jump lands at the very end.
    const frame = requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen, activeChatId, messages, loading, slotHint, reducedMotion]);

  return endRef;
}