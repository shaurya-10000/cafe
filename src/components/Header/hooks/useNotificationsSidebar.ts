import { useCallback, useEffect, useRef, useState } from "react";

import { OPEN_NOTIFICATIONS } from "@/lib/core/events";

import type { OpenNotificationsEventDetail } from "../types";
import { useLatestRef } from "./useLatestRef";
import { useScrollLock } from "./useScrollLock";

interface UseNotificationsSidebarOptions {
  userId: string | null | undefined;
  pathname: string | null;
  unreadCount: number;
  markAllRead: () => void | Promise<void>;
}

export interface UseNotificationsSidebarResult {
  isOpen: boolean;
  /** Open the sidebar; `trigger` receives focus again when it closes. */
  open: (trigger?: HTMLElement | null) => void;
  /** Close and restore focus to the trigger that opened it. */
  close: () => void;
  /** Close without restoring focus (e.g. during sign-out). */
  dismiss: () => void;
}

export function useNotificationsSidebar({
  userId,
  pathname,
  unreadCount,
  markAllRead,
}: UseNotificationsSidebarOptions): UseNotificationsSidebarResult {
  const [isOpen, setIsOpen] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const unreadCountRef = useLatestRef(unreadCount);
  const markAllReadRef = useLatestRef(markAllRead);

  useScrollLock(isOpen);

  // Close on route change: adjust state during render, guarded by the previous
  // pathname, instead of setting it from an effect.
  const [previousPathname, setPreviousPathname] = useState(pathname);
  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    triggerRef.current = null;
  }, [pathname]);

  const open = useCallback(
    (trigger?: HTMLElement | null) => {
      if (!userId) return;

      triggerRef.current = trigger ?? null;

      setIsOpen(true);

      if (unreadCountRef.current > 0) {
        void markAllReadRef.current();
      }
    },
    [markAllReadRef, unreadCountRef, userId],
  );

  const close = useCallback(() => {
    setIsOpen(false);

    const trigger = triggerRef.current;

    triggerRef.current = null;

    requestAnimationFrame(() => {
      trigger?.focus?.();
    });
  }, []);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    triggerRef.current = null;
  }, []);

  // Allow any part of the app to open the sidebar via a window event.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event): void => {
      const detail = (event as CustomEvent<OpenNotificationsEventDetail>)
        .detail;

      open(null);

      if (process.env.NODE_ENV !== "production" && detail?.source) {
        console.debug(
          `[header] notifications opened via event, source=${detail.source}`,
        );
      }
    };

    window.addEventListener(OPEN_NOTIFICATIONS, handler);

    return () => {
      window.removeEventListener(OPEN_NOTIFICATIONS, handler);
    };
  }, [open]);

  return { isOpen, open, close, dismiss };
}