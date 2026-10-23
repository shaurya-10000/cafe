"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from "react";
import { useSupabaseClient } from "../supabase/client";
import { playNotificationSound, unlockNotificationSound } from "../media/audio";
import { toast } from "sonner";
import { useUser, useAuth } from "@clerk/nextjs";

export interface AppNotification {
  id: string; user_id: string; title: string; message: string; type: string;
  order_id?: string | null; created_at: string; is_read: boolean;
}

interface AppContextType {
  cartCount: number; setCartCount: React.Dispatch<React.SetStateAction<number>>;
  favCount: number; refreshCounts: () => Promise<void>;
  unreadCount: number; latestNotification: AppNotification | null;
  markAllNotificationsRead: () => Promise<void>;
  decrementUnreadCount: () => void;
  isCartOpen: boolean; setCartOpen: (open: boolean) => void;
  notificationsMuted: boolean; toggleNotificationsMuted: () => Promise<void>;
  mutedTypes: string[]; toggleTypeMuted: (type: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SUPABASE_TIMEOUT_MS = 10_000;
const JWT_RETRY_ATTEMPTS = 2;
const JWT_RETRY_DELAY_MS = 300;
const CART_REFRESH_DEBOUNCE_MS = 250;
const REALTIME_TOKEN_REFRESH_MS = 45_000;
const REALTIME_AUTH_ATTEMPTS = 4;
const REALTIME_AUTH_RETRY_MS = 500;
const UNLOCK_GESTURE_EVENTS = ["click", "keydown", "touchend"] as const;

const RETRYABLE_JWT_ERROR_CODES = new Set(["PGRST303", "42501"]);

interface PostgrestLikeError { code?: string; message?: string; details?: string | null; hint?: string | null; }

function isPostgrestErrorLike(error: unknown): error is PostgrestLikeError {
  return typeof error === "object" && error !== null && ("code" in error || "message" in error || "details" in error || "hint" in error);
}

function isAbortLikeError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "TimeoutError") return true;
  if (typeof error === "object" && error !== null && Object.keys(error).length === 0) return true;
  return false;
}

function logSupabaseError(label: string, error: unknown): void {
  if (isAbortLikeError(error)) return;
  if (isPostgrestErrorLike(error)) {
    if (error.code === "PGRST301") {
      console.error(`${label} — PGRST301: Supabase rejected the Clerk JWT. Add Clerk as a trusted third-party auth provider. Underlying error:`, error);
      return;
    }
    console.error(`${label} [${error.code ?? "no-code"}]`, { message: error.message, details: error.details, hint: error.hint, code: error.code });
    return;
  }
  console.error(label, error);
}

const hasAbortSignalTimeout = typeof AbortSignal !== "undefined" && typeof (AbortSignal as { timeout?: unknown }).timeout === "function";

function timeoutSignal(): AbortSignal {
  if (hasAbortSignalTimeout) return AbortSignal.timeout(SUPABASE_TIMEOUT_MS);
  const controller = new AbortController();
  setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), SUPABASE_TIMEOUT_MS);
  return controller.signal;
}

async function withJwtRetry<T>(op: () => PromiseLike<T>, attempts = JWT_RETRY_ATTEMPTS, delayMs = JWT_RETRY_DELAY_MS): Promise<T> {
  type MaybeError = { error?: PostgrestLikeError | null };
  let result = (await op()) as Awaited<T> & MaybeError;
  for (let i = 1; i < attempts; i++) {
    const code = result?.error?.code;
    if (!code || !RETRYABLE_JWT_ERROR_CODES.has(code)) break;
    await new Promise((r) => setTimeout(r, delayMs));
    result = (await op()) as Awaited<T> & MaybeError;
  }
  return result as T;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id ?? null;

  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);
  const [isCartOpen, setCartOpen] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [mutedTypes, setMutedTypes] = useState<string[]>([]);

  const mutedRef = useRef(false);
  const mutedTypesRef = useRef<string[]>([]);
  const unreadCountRef = useRef(unreadCount);
  const getTokenRef = useRef(getToken);
  const userIdRef = useRef(userId);
  const supabase = useSupabaseClient();

  useEffect(() => { mutedRef.current = notificationsMuted; }, [notificationsMuted]);
  useEffect(() => { mutedTypesRef.current = mutedTypes; }, [mutedTypes]);
  useEffect(() => { unreadCountRef.current = unreadCount; }, [unreadCount]);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const refreshCounts = useCallback(async () => {
    if (!userId) { setCartCount(0); setFavCount(0); return; }
    try {
      const [cartResult, favResult] = await Promise.all([
        withJwtRetry(() => supabase.from("cart_items").select("quantity").eq("user_id", userId).abortSignal(timeoutSignal())),
        withJwtRetry(() => supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", userId).abortSignal(timeoutSignal())),
      ]);
      if (userIdRef.current !== userId) return;
      if (cartResult.error) logSupabaseError("Failed to refresh cart count", cartResult.error);
      else setCartCount((cartResult.data ?? []).reduce((sum: number, row: { quantity: number | null }) => sum + (row.quantity ?? 0), 0));
      if (favResult.error) logSupabaseError("Failed to refresh favorites count", favResult.error);
      else setFavCount(favResult.count ?? 0);
    } catch (err) { logSupabaseError("Failed to refresh counts", err); }
  }, [supabase, userId]);

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) { setUnreadCount(0); return; }
    try {
      const { count, error } = await withJwtRetry(() => supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false).abortSignal(timeoutSignal()));
      if (userIdRef.current !== userId) return;
      if (error) { logSupabaseError("Failed to refresh unread count", error); return; }
      setUnreadCount(count ?? 0);
    } catch (err) { logSupabaseError("Failed to refresh unread count", err); }
  }, [supabase, userId]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!userId) return;
    const decrementBy = unreadCountRef.current;
    if (decrementBy <= 0) return;
    setUnreadCount(0);
    try {
      const { error } = await withJwtRetry(() => supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false).abortSignal(timeoutSignal()));
      if (error) { logSupabaseError("Failed to mark notifications as read", error); setUnreadCount((prev) => prev + decrementBy); }
    } catch (err) { logSupabaseError("Failed to mark notifications as read", err); setUnreadCount((prev) => prev + decrementBy); }
  }, [supabase, userId]);

  const decrementUnreadCount = useCallback(() => { setUnreadCount((prev) => Math.max(0, prev - 1)); }, []);

  const loadMutedSetting = useCallback(async () => {
    if (!userId) { setNotificationsMuted(false); setMutedTypes([]); return; }
    try {
      const { data, error } = await withJwtRetry(() => supabase.from("notification_settings").select("muted, muted_types").eq("user_id", userId).abortSignal(timeoutSignal()).maybeSingle());
      if (userIdRef.current !== userId) return;
      if (error) { logSupabaseError("Failed to load notification settings", error); return; }
      setNotificationsMuted(data?.muted ?? false);
      setMutedTypes(data?.muted_types ?? []);
    } catch (err) { logSupabaseError("Failed to load notification settings", err); }
  }, [supabase, userId]);

  const toggleNotificationsMuted = useCallback(async () => {
    if (!userId) return;
    const next = !mutedRef.current;
    mutedRef.current = next; setNotificationsMuted(next);
    try {
      const { error } = await withJwtRetry(() => supabase.from("notification_settings").upsert({ user_id: userId, muted: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).abortSignal(timeoutSignal()));
      if (error) { logSupabaseError("Failed to save mute preference", error); mutedRef.current = !next; setNotificationsMuted(!next); }
    } catch (err) { logSupabaseError("Failed to save mute preference", err); mutedRef.current = !next; setNotificationsMuted(!next); }
  }, [supabase, userId]);

  const toggleTypeMuted = useCallback(async (type: string) => {
    if (!userId) return;
    const current = mutedTypesRef.current;
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    mutedTypesRef.current = next; setMutedTypes(next);
    try {
      const { error } = await withJwtRetry(() => supabase.from("notification_settings").upsert({ user_id: userId, muted_types: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).abortSignal(timeoutSignal()));
      if (error) { logSupabaseError("Failed to save per-type mute preference", error); mutedTypesRef.current = current; setMutedTypes(current); }
    } catch (err) { logSupabaseError("Failed to save per-type mute preference", err); mutedTypesRef.current = current; setMutedTypes(current); }
  }, [supabase, userId]);

  useEffect(() => {
    function detach() { for (const eventName of UNLOCK_GESTURE_EVENTS) window.removeEventListener(eventName, onGesture); }
    function onGesture() { void unlockNotificationSound().then((ok) => { if (ok) detach(); }); }
    for (const eventName of UNLOCK_GESTURE_EVENTS) window.addEventListener(eventName, onGesture, { passive: true });
    return detach;
  }, []);

  useEffect(() => {
    // The loaders reset their slice of state when signed out, which is the
    // intended synchronization with the auth state, not a derivable value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCounts(); void refreshUnreadCount(); void loadMutedSetting();
    if (!userId) return;
    let cancelled = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    let cartDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let hasSubscribedOnce = false;

    const authenticateRealtime = async (): Promise<boolean> => {
      try {
        const token = await getTokenRef.current();
        if (!token) return false;
        await supabase.realtime.setAuth(token);
        return true;
      } catch (err) { logSupabaseError("Realtime auth setup failed", err); return false; }
    };

    const setupRealtime = async () => {
      let authed = false;
      for (let attempt = 0; attempt < REALTIME_AUTH_ATTEMPTS && !authed && !cancelled; attempt++) {
        authed = await authenticateRealtime();
        if (!authed) await new Promise((r) => setTimeout(r, REALTIME_AUTH_RETRY_MS));
      }
      if (cancelled || !authed) { if (!cancelled) console.warn("Realtime: no Clerk token available, not subscribing"); return; }

      const channel = supabase.channel(`app_notifications_${userId}_${Date.now()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload: { new: AppNotification }) => {
            const notification = payload.new;
            setLatestNotification(notification);
            setUnreadCount((prev) => prev + 1);
            if (mutedRef.current || mutedTypesRef.current.includes(notification.type)) return;
            playNotificationSound();
            toast(notification.title, { description: notification.message });
          })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => { void refreshUnreadCount(); })
        .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` }, () => {
            if (cartDebounceTimer) clearTimeout(cartDebounceTimer);
            cartDebounceTimer = setTimeout(() => { cartDebounceTimer = null; void refreshCounts(); }, CART_REFRESH_DEBOUNCE_MS);
          })
        .subscribe((status, err) => {
          const state = String(status);
          if (state === "SUBSCRIBED") {
            if (hasSubscribedOnce && !cancelled) { void refreshCounts(); void refreshUnreadCount(); }
            hasSubscribedOnce = true; return;
          }
          if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") console.warn(`Realtime channel ${state}:`, err?.message ?? "no detail from server");
        });

      if (cancelled) { void supabase.removeChannel(channel); return; }
      realtimeChannel = channel;
    };

    void setupRealtime();
    const tokenRefreshTimer = setInterval(() => { if (userIdRef.current) void authenticateRealtime(); }, REALTIME_TOKEN_REFRESH_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!userIdRef.current) return;
      void authenticateRealtime(); void refreshCounts(); void refreshUnreadCount();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true; clearInterval(tokenRefreshTimer);
      if (cartDebounceTimer) clearTimeout(cartDebounceTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (realtimeChannel) void supabase.removeChannel(realtimeChannel);
    };
  }, [refreshCounts, refreshUnreadCount, loadMutedSetting, supabase, userId]);

  const contextValue = useMemo<AppContextType>(() => ({
    cartCount, setCartCount, favCount, refreshCounts, unreadCount, latestNotification, markAllNotificationsRead, decrementUnreadCount, isCartOpen, setCartOpen, notificationsMuted, toggleNotificationsMuted, mutedTypes, toggleTypeMuted,
  }), [cartCount, favCount, refreshCounts, unreadCount, latestNotification, markAllNotificationsRead, decrementUnreadCount, isCartOpen, notificationsMuted, toggleNotificationsMuted, mutedTypes, toggleTypeMuted]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
