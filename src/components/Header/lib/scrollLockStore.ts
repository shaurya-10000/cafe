import {
  SCROLL_LOCK_WATCHDOG_GRACE_MS,
  SCROLL_LOCK_WATCHDOG_INTERVAL_MS,
} from "../constants";
import { reportHeaderIssue } from "./observability";

/**
 * Reference-counted body scroll lock.
 *
 * The listeners/watchdog are installed only while at least one consumer is
 * mounted, so there are no permanent module-level timers. This keeps it safe
 * for the App Router, React Strict Mode, Fast Refresh, Vitest/JSDOM and
 * multiple Header instances. The watchdog only recovers foreign locks when
 * there are no owners.
 */

interface ScrollLockState {
  count: number;
  watchdogHandle: ReturnType<typeof setInterval> | null;
  watchdogGraceUntil: number;
  infrastructureUsers: number;
  cleanupInfrastructure: (() => void) | null;
}

const state: ScrollLockState = {
  count: 0,
  watchdogHandle: null,
  watchdogGraceUntil: 0,
  infrastructureUsers: 0,
  cleanupInfrastructure: null,
};

function clearBodyLock(): void {
  if (typeof document === "undefined") return;

  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
}

export function touchWatchdogGrace(): void {
  state.watchdogGraceUntil = Date.now() + SCROLL_LOCK_WATCHDOG_GRACE_MS;
}

function runWatchdog(): void {
  if (typeof document === "undefined") return;
  if (document.visibilityState !== "visible") return;
  if (Date.now() < state.watchdogGraceUntil) return;
  if (state.count !== 0) return;

  const computedOverflow = window.getComputedStyle(document.body).overflow;

  if (computedOverflow !== "hidden") return;

  clearBodyLock();
  reportHeaderIssue("scroll_lock_leak_recovered", { source: "watchdog" });
}

export function installScrollLockInfrastructure(): void {
  if (typeof window === "undefined") return;

  state.infrastructureUsers += 1;

  if (state.cleanupInfrastructure) return;

  touchWatchdogGrace();

  const handlePageShow = (): void => {
    touchWatchdogGrace();

    if (state.count === 0 && document.body.style.overflow === "hidden") {
      clearBodyLock();
      reportHeaderIssue("scroll_lock_leak_recovered", { source: "pageshow" });
    }
  };

  const handlePopState = (): void => {
    touchWatchdogGrace();
  };

  const handleVisibilityChange = (): void => {
    if (document.visibilityState !== "visible") return;
    touchWatchdogGrace();
  };

  window.addEventListener("pageshow", handlePageShow);
  window.addEventListener("popstate", handlePopState);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  state.watchdogHandle = setInterval(
    runWatchdog,
    SCROLL_LOCK_WATCHDOG_INTERVAL_MS,
  );

  state.cleanupInfrastructure = () => {
    window.removeEventListener("pageshow", handlePageShow);
    window.removeEventListener("popstate", handlePopState);
    document.removeEventListener("visibilitychange", handleVisibilityChange);

    if (state.watchdogHandle !== null) {
      clearInterval(state.watchdogHandle);
      state.watchdogHandle = null;
    }

    state.watchdogGraceUntil = 0;
    state.cleanupInfrastructure = null;
  };
}

export function uninstallScrollLockInfrastructure(): void {
  state.infrastructureUsers = Math.max(0, state.infrastructureUsers - 1);

  if (state.infrastructureUsers > 0) return;

  state.cleanupInfrastructure?.();
}

export function applyScrollLock(): void {
  if (typeof document === "undefined") return;

  if (state.count === 0) {
    const { body, documentElement } = document;

    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - documentElement.clientWidth,
    );

    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      const currentPadding =
        Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
  }

  state.count += 1;
}

export function releaseScrollLock(): void {
  if (typeof document === "undefined") return;

  state.count = Math.max(0, state.count - 1);

  if (state.count !== 0) return;

  clearBodyLock();
}
