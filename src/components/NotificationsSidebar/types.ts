import type { useApp } from "@/utils/providers/AppContext";
import type { useSupabaseClient } from "@/utils/supabase/client";

/**
 * Named NotificationRow (not `Notification`) to avoid shadowing the browser's
 * built-in Notification API, which push.ts relies on elsewhere in this
 * codebase, and to match the row shape used server-side in
 * app/api/webhooks/push/route.ts.
 */
export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  order_id?: string | null;
  created_at: string;
  is_read: boolean;
}

export interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isAdmin?: boolean;
}

export type PushState = "unsupported" | "denied" | "subscribed" | "unsubscribed";

export type SupabaseClient = ReturnType<typeof useSupabaseClient>;

export type LatestNotification = ReturnType<typeof useApp>["latestNotification"];
