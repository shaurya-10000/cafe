"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  RATE_LIMIT_MAX_SENDS,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/ai/constants";

type ConsumeResult = { ok: true } | { ok: false; retryAfter: number };

interface UseRateLimitResult {
  readonly cooldownSeconds: number;
  readonly canSend: boolean;
  readonly tryConsume: () => ConsumeResult;
  readonly startCooldown: (seconds: number) => void;
}

/** Client-side sliding-window send limiter plus a visible cooldown timer. */
export function useRateLimit(): UseRateLimitResult {
  const timestampsRef = useRef<number[]>([]);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setTimeout(
      () => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)),
      1_000,
    );

    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const tryConsume = useCallback((): ConsumeResult => {
    const now = Date.now();
    timestampsRef.current = timestampsRef.current.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );

    if (timestampsRef.current.length >= RATE_LIMIT_MAX_SENDS) {
      const oldest = timestampsRef.current[0] ?? now;
      const retryAfter = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1_000,
      );
      return { ok: false, retryAfter };
    }

    timestampsRef.current.push(now);
    return { ok: true };
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownSeconds(Math.max(1, Math.ceil(seconds)));
  }, []);

  return {
    cooldownSeconds,
    canSend: cooldownSeconds === 0,
    tryConsume,
    startCooldown,
  };
}