import { MAX_NOTIFICATIONS } from "../constants";
import type { NotificationRow, SupabaseClient } from "../types";

/** Latest notifications for a user, newest first. Throws the raw Supabase error. */
export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_NOTIFICATIONS);

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

/** Throws the raw Supabase error on failure. */
export async function deleteNotificationById(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}
