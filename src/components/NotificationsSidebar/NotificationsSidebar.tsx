"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSupabaseClient } from "@/utils/supabase/client";
import { useApp } from "@/utils/providers/AppContext";
import { DeleteErrorBanner } from "./components/DeleteErrorBanner";
import { NotificationList } from "./components/NotificationList";
import { PreferencesPanel } from "./components/PreferencesPanel";
import { SidebarHeader } from "./components/SidebarHeader";
import { useModalBehavior } from "./hooks/useModalBehavior";
import { useNotificationEvents } from "./hooks/useNotificationEvents";
import { useNotificationNavigation } from "./hooks/useNotificationNavigation";
import { useNotifications } from "./hooks/useNotifications";
import { usePushSubscription } from "./hooks/usePushSubscription";
import { getOverlayMotion, getPanelMotion } from "./lib/motion";
import type { NotificationsSidebarProps } from "./types";

export default function NotificationsSidebar({
  isOpen,
  onClose,
  userId,
  isAdmin = false,
}: NotificationsSidebarProps) {
  const supabase = useSupabaseClient();
  const reducedMotion = useReducedMotion() ?? false;

  const {
    latestNotification,
    notificationsMuted,
    toggleNotificationsMuted,
    mutedTypes,
    toggleTypeMuted,
    decrementUnreadCount,
  } = useApp();

  const [showPreferences, setShowPreferences] = useState(false);

  const push = usePushSubscription({ supabase, userId, isOpen });

  const {
    notifications,
    isLoading,
    deleteError,
    deleteNotification,
    dismissDeleteError,
  } = useNotifications({
    supabase,
    userId,
    latestNotification,
    onUnreadRemoved: decrementUnreadCount,
  });

  const { openNotification, rateOrder } = useNotificationNavigation({
    isAdmin,
    onClose,
  });

  useModalBehavior(isOpen, onClose);

  useNotificationEvents({
    notificationsMuted,
    mutedTypes,
    pushState: push.pushState,
    toggleNotificationsMuted,
    toggleTypeMuted,
    togglePush: push.togglePush,
  });

  const handleToggleMuted = useCallback(() => {
    void toggleNotificationsMuted();
  }, [toggleNotificationsMuted]);

  const handleToggleType = useCallback(
    (type: string) => {
      void toggleTypeMuted(type);
    },
    [toggleTypeMuted],
  );

  const handleTogglePush = useCallback(() => {
    void push.togglePush();
  }, [push]);

  const handleTogglePreferences = useCallback(() => {
    setShowPreferences((value) => !value);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      void deleteNotification(id);
    },
    [deleteNotification],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            {...getOverlayMotion(reducedMotion)}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            {...getPanelMotion(reducedMotion)}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            className="fixed right-0 top-0 z-[101] flex h-full w-full flex-col border-l border-zinc-200 bg-white/90 shadow-2xl backdrop-blur-3xl dark:border-white/5 dark:bg-zinc-950/90 sm:max-w-[400px]"
          >
            <SidebarHeader
              pushState={push.pushState}
              pushLoading={push.isLoading}
              onTogglePush={handleTogglePush}
              muted={notificationsMuted}
              onToggleMuted={handleToggleMuted}
              preferencesOpen={showPreferences}
              onTogglePreferences={handleTogglePreferences}
              onClose={onClose}
            />

            <PreferencesPanel
              open={showPreferences}
              mutedTypes={mutedTypes}
              onToggleType={handleToggleType}
              reducedMotion={reducedMotion}
            />

            {deleteError && (
              <DeleteErrorBanner
                message={deleteError}
                onDismiss={dismissDeleteError}
              />
            )}

            <NotificationList
              notifications={notifications}
              isLoading={isLoading}
              reducedMotion={reducedMotion}
              onOpen={openNotification}
              onDelete={handleDelete}
              onRate={rateOrder}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
