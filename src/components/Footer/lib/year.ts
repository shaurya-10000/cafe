import { MAX_TIMER_DELAY_MS } from "../constants";

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function msUntilNextYear(): number {
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
  return Math.max(0, nextYear.getTime() - now.getTime());
}

export function clampTimerDelay(delay: number): number {
  if (!Number.isFinite(delay) || delay < 0) return 0;
  return Math.min(delay, MAX_TIMER_DELAY_MS);
}
