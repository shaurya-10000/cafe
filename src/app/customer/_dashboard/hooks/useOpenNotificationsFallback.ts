"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { OPEN_NOTIFICATIONS } from "@/lib/core/events";

import { OPEN_NOTIFICATIONS_ROUTE } from "../constants";

/**
 * ChatWidget dispatches cafe_open_notifications when the AI proposes
 * OPEN_NOTIFICATIONS. On dashboard routes the global header (which owns the
 * notifications sidebar) isn't mounted, so this falls back to routing home,
 * where the header's own listener handles the actual open.
 */
export function useOpenNotificationsFallback(): void {
  const router = useRouter();

  useEffect(() => {
    const handler = () => {
      router.push(OPEN_NOTIFICATIONS_ROUTE);
    };

    window.addEventListener(OPEN_NOTIFICATIONS, handler);
    return () => window.removeEventListener(OPEN_NOTIFICATIONS, handler);
  }, [router]);
}