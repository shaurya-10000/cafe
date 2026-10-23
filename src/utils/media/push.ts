"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

const SW_PATH = "/sw.js";
const RPC_MAX_ATTEMPTS = 3;
const RPC_RETRY_DELAY_MS = 400;
const RETRYABLE_RPC_CODES = new Set(["PGRST303", "42501"]);
const AUTH_REQUIRED_MESSAGE = "authentication required";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PostgrestLikeError { code?: string; message?: string; }

function isRetryableRpcError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, message } = error as PostgrestLikeError;
  if (typeof code === "string" && RETRYABLE_RPC_CODES.has(code)) return true;
  return typeof message === "string" && message.toLowerCase().includes(AUTH_REQUIRED_MESSAGE);
}

async function subscribeWithKey(registration: ServiceWorkerRegistration, applicationServerKey: Uint8Array<ArrayBuffer>): Promise<PushSubscription> {
  const options: PushSubscriptionOptionsInit = { userVisibleOnly: true, applicationServerKey: applicationServerKey as BufferSource };
  try {
    return await registration.pushManager.subscribe(options);
  } catch (error) {
    if (error instanceof DOMException && error.name === "InvalidStateError") {
      const stale = await registration.pushManager.getSubscription();
      if (stale) {
        await stale.unsubscribe();
        return registration.pushManager.subscribe(options);
      }
    }
    throw error;
  }
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export type PushSubscriptionState = "unsupported" | "denied" | "subscribed" | "unsubscribed";

export async function getPushSubscriptionState(): Promise<PushSubscriptionState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return "unsubscribed";
    const existing = await registration.pushManager.getSubscription();
    return existing ? "subscribed" : "unsubscribed";
  } catch (error) {
    console.error("Failed to read push subscription state:", error);
    return "unsubscribed";
  }
}

export async function subscribeToPush(supabase: SupabaseClient, userId?: string): Promise<boolean> {
  if (!isPushSupported()) { console.warn("Push notifications aren't supported in this browser."); return false; }
  if (!userId) { console.error("subscribeToPush: userId is required to persist a subscription."); return false; }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) { console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set."); return false; }

  let permission: NotificationPermission;
  try { permission = await Notification.requestPermission(); } catch (error) { console.error("Failed to request notification permission:", error); return false; }
  if (permission !== "granted") return false;

  let subscription: PushSubscription;
  try {
    let registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!registration) registration = await navigator.serviceWorker.register(SW_PATH);
    await navigator.serviceWorker.ready;
    subscription = await subscribeWithKey(registration, urlBase64ToUint8Array(vapidPublicKey));
  } catch (error) { console.error("Failed to register service worker or create push subscription:", error); return false; }

  const raw = subscription.toJSON();
  if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) { console.error("Push subscription is missing required fields."); return false; }

  for (let attempt = 1; attempt <= RPC_MAX_ATTEMPTS; attempt++) {
    const { error } = await supabase.rpc("claim_push_subscription", { p_endpoint: raw.endpoint, p_p256dh: raw.keys.p256dh, p_auth: raw.keys.auth });
    if (!error) return true;
    const retryable = isRetryableRpcError(error);
    const lastAttempt = attempt === RPC_MAX_ATTEMPTS;
    if (!retryable || lastAttempt) { console.error("Failed to save push subscription:", error); return false; }
    await delay(RPC_RETRY_DELAY_MS * attempt);
  }
  return false;
}

export async function unsubscribeFromPush(supabase: SupabaseClient): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    if (error) console.error("Failed to remove push subscription from database:", error);
    await subscription.unsubscribe();
  } catch (error) {
    console.error("Failed to unsubscribe from push:", error);
  }
}
