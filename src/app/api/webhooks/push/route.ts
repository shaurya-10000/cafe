import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const _supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const _vapidSubject = process.env.VAPID_SUBJECT;
const _vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const _vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const _pushWebhookSecret = process.env.PUSH_WEBHOOK_SECRET;

if (!_supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
if (!_supabaseServiceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
if (!_vapidSubject) throw new Error("Missing VAPID_SUBJECT.");
if (!_vapidPublicKey) throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
if (!_vapidPrivateKey) throw new Error("Missing VAPID_PRIVATE_KEY.");
if (!_pushWebhookSecret) throw new Error("Missing PUSH_WEBHOOK_SECRET.");

const supabaseUrl: string = _supabaseUrl;
const supabaseServiceRoleKey: string = _supabaseServiceRoleKey;
const pushWebhookSecret: string = _pushWebhookSecret;

webpush.setVapidDetails(_vapidSubject, _vapidPublicKey, _vapidPrivateKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PUSH_TTL_SECONDS = 60 * 60;
const PUSH_TIMEOUT_MS = 10_000;
const WNS_HOST_SUFFIX = ".notify.windows.com";

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  order_id?: string | null;
}

interface DatabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record?: unknown;
}

type DeliveryLogStatus = "sent" | "failed" | "skipped_muted" | "skipped_no_subscription";

interface DeliveryLogRow {
  notification_id: string;
  user_id: string;
  status: DeliveryLogStatus;
  endpoint?: string;
  http_status?: number | null;
  error_detail?: string;
}

function isNotificationRow(value: unknown): value is NotificationRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.user_id === "string" && row.user_id.trim().length > 0 && typeof row.title === "string" && typeof row.message === "string" && typeof row.type === "string";
}

const expectedSecretDigest = createHash("sha256").update(pushWebhookSecret, "utf8").digest();

function isValidWebhookSecret(providedHeader: string | null): boolean {
  if (!providedHeader) return false;
  const providedDigest = createHash("sha256").update(providedHeader, "utf8").digest();
  return timingSafeEqual(providedDigest, expectedSecretDigest);
}

function urlForType(type: string): string {
  switch (type) {
    case "review_prompt":
    case "order_status":
    case "order_placed":
    case "payment_status":
    case "payment_failed":
      return "/customer?tab=active";
    case "new_order":
    case "refund_required":
    case "payment_dispute":
      return "/admin?tab=orders";
    case "new_booking":
      return "/admin?tab=reservations";
    case "booking_status":
    case "booking_reminder":
      return "/customer?tab=bookings";
    default:
      return "/";
  }
}

function isWnsEndpoint(endpoint: string): boolean {
  try {
    return new URL(endpoint).hostname.endsWith(WNS_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function isDeadSubscription(endpoint: string, statusCode?: number): boolean {
  if (statusCode === 404 || statusCode === 410) return true;
  if (statusCode === 401 && isWnsEndpoint(endpoint)) return true;
  return false;
}

async function logDelivery(row: DeliveryLogRow): Promise<void> {
  const { error } = await supabaseAdmin.from("push_delivery_log").insert(row);
  if (error) console.error("Push webhook: failed to write delivery log:", error);
}

export async function POST(request: NextRequest) {
  if (!isValidWebhookSecret(request.headers.get("x-webhook-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: DatabaseWebhookPayload;
  try {
    body = (await request.json()) as DatabaseWebhookPayload;
  } catch (error: unknown) {
    console.error("Push webhook: request body was not valid JSON:", error);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.type !== "INSERT") {
    return NextResponse.json({ skipped: "not_insert" });
  }

  if (!isNotificationRow(body.record)) {
    console.error("Push webhook: payload record failed shape validation:", { record: body.record });
    return NextResponse.json({ error: "Malformed notification record" }, { status: 400 });
  }

  const record = body.record;

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("notification_settings")
    .select("muted, muted_types")
    .eq("user_id", record.user_id)
    .maybeSingle();

  if (settingsError) {
    console.error("Push webhook: failed to load notification settings:", { userId: record.user_id, error: settingsError.message });
  }

  if (settings?.muted) {
    await logDelivery({ notification_id: record.id, user_id: record.user_id, status: "skipped_muted", error_detail: "muted_all" });
    return NextResponse.json({ skipped: "muted" });
  }

  if (settings?.muted_types?.includes(record.type)) {
    await logDelivery({ notification_id: record.id, user_id: record.user_id, status: "skipped_muted", error_detail: `muted_type:${record.type}` });
    return NextResponse.json({ skipped: "type_muted" });
  }

  const { data: subscriptions, error: subsError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", record.user_id);

  if (subsError) {
    console.error("Push webhook: failed to load subscriptions:", { userId: record.user_id, error: subsError.message });
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    await logDelivery({ notification_id: record.id, user_id: record.user_id, status: "skipped_no_subscription" });
    return NextResponse.json({ skipped: "no subscriptions" });
  }

  const payload = JSON.stringify({
    notificationId: record.id,
    title: record.title,
    body: record.message,
    url: urlForType(record.type),
    type: record.type,
    orderId: record.order_id ?? null,
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: PUSH_TTL_SECONDS, urgency: "high", timeout: PUSH_TIMEOUT_MS }
      )
    )
  );

  const deadEndpoints: string[] = [];
  const logRows: DeliveryLogRow[] = results.map((result, i) => {
    const sub = subscriptions[i];
    if (result.status === "fulfilled") {
      return { notification_id: record.id, user_id: record.user_id, endpoint: sub.endpoint, status: "sent" as const, http_status: result.value?.statusCode ?? null };
    }
    const reason = result.reason as { statusCode?: number; body?: string };
    const statusCode = reason?.statusCode;
    const errorBody = reason?.body;
    if (isDeadSubscription(sub.endpoint, statusCode)) {
      deadEndpoints.push(sub.endpoint);
    }
    return {
      notification_id: record.id,
      user_id: record.user_id,
      endpoint: sub.endpoint,
      status: "failed" as const,
      http_status: statusCode ?? null,
      error_detail: `HTTP ${statusCode ?? "unknown"}: ${errorBody ?? String(result.reason)}`.slice(0, 500),
    };
  });

  const { error: logError } = await supabaseAdmin.from("push_delivery_log").insert(logRows);
  if (logError) {
    console.error("Push webhook: failed to write delivery log:", { notificationId: record.id, error: logError.message });
  }

  if (deadEndpoints.length > 0) {
    const { error: cleanupError } = await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
    if (cleanupError) {
      console.error("Push webhook: failed to clean up dead subscriptions:", { count: deadEndpoints.length, error: cleanupError.message });
    }
  }

  return NextResponse.json({ sent: results.filter((r) => r.status === "fulfilled").length });
}
