import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const _supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const _clerkWebhookSigningSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? process.env.CLERK_WEBHOOK_SECRET;

if (!_supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
if (!_supabaseServiceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
if (!_clerkWebhookSigningSecret) throw new Error("Missing CLERK_WEBHOOK_SIGNING_SECRET (or CLERK_WEBHOOK_SECRET).");

const supabaseUrl: string = _supabaseUrl;
const supabaseServiceRoleKey: string = _supabaseServiceRoleKey;
const clerkWebhookSigningSecret: string = _clerkWebhookSigningSecret;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SUPPORTED_EVENTS = new Set(["user.created", "user.updated", "user.deleted"]);
type ClerkWebhookEvent = Awaited<ReturnType<typeof verifyWebhook>>;
type SupportedUserEvent = Extract<ClerkWebhookEvent, { type: "user.created" | "user.updated" | "user.deleted" }>;
type SupportedProfileEvent = Extract<ClerkWebhookEvent, { type: "user.created" | "user.updated" }>;

function resolveEventTimestamp(event: ClerkWebhookEvent, svixTimestampHeader: string | null): { date: Date; source: "event" | "svix-header" | "now" } {
  const payloadTs = (event as unknown as { timestamp?: unknown }).timestamp;
  if (typeof payloadTs === "number" && Number.isFinite(payloadTs) && payloadTs > 0) {
    const date = new Date(payloadTs);
    if (!Number.isNaN(date.getTime())) return { date, source: "event" };
  }
  if (svixTimestampHeader) {
    const seconds = Number(svixTimestampHeader);
    if (Number.isFinite(seconds) && seconds > 0) {
      const date = new Date(seconds * 1000);
      if (!Number.isNaN(date.getTime())) return { date, source: "svix-header" };
    }
  }
  return { date: new Date(), source: "now" };
}

function buildProfilePayload(event: SupportedProfileEvent) {
  const { email_addresses, primary_email_address_id, phone_numbers, primary_phone_number_id, first_name, last_name, image_url, username, updated_at } = event.data;
  const primaryEmail = email_addresses?.find((email: { id: string; email_address: string }) => email.id === primary_email_address_id)?.email_address ?? email_addresses?.[0]?.email_address ?? null;
  const primaryPhone = phone_numbers?.find((phone: { id: string; phone_number: string }) => phone.id === primary_phone_number_id)?.phone_number ?? phone_numbers?.[0]?.phone_number ?? null;
  const fullName = [first_name, last_name].filter((value): value is string => typeof value === "string" && value.trim().length > 0).join(" ").trim() || (primaryEmail ? primaryEmail.split("@")[0] : "Customer");
  const updatedAt = new Date(updated_at);
  if (Number.isNaN(updatedAt.getTime())) throw new Error("Invalid Clerk user updated_at timestamp.");
  return { email: primaryEmail, full_name: fullName, avatar_url: image_url ?? null, username: username ?? null, phone: primaryPhone, updated_at: updatedAt.toISOString() };
}

export async function POST(req: NextRequest) {
  const webhookId = req.headers.get("svix-id");
  if (!webhookId || webhookId.trim().length === 0) {
    return NextResponse.json({ error: "Missing webhook event ID" }, { status: 400 });
  }

  let event: ClerkWebhookEvent;
  try {
    event = await verifyWebhook(req, { signingSecret: clerkWebhookSigningSecret });
  } catch (error: unknown) {
    console.error("Clerk webhook verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (!SUPPORTED_EVENTS.has(event.type)) {
    return NextResponse.json({ success: true, ignored: true, eventType: event.type });
  }

  const supportedEvent = event as SupportedUserEvent;
  const ts = resolveEventTimestamp(event, req.headers.get("svix-timestamp"));
  if (ts.source !== "event") {
    console.warn("Clerk webhook payload had no usable timestamp; ordering falls back to:", { eventId: webhookId, source: ts.source });
  }
  const eventTimestamp: Date = ts.date;
  const userId = supportedEvent.data.id;

  if (typeof userId !== "string" || userId.trim().length === 0) {
    console.error("Clerk webhook payload is missing user ID:", { eventId: webhookId, eventType: supportedEvent.type });
    return NextResponse.json({ error: "Webhook payload is missing user ID" }, { status: 400 });
  }

  try {
    const profile = supportedEvent.type === "user.created" || supportedEvent.type === "user.updated" ? buildProfilePayload(supportedEvent) : null;
    const { data, error } = await supabaseAdmin.rpc("process_clerk_webhook", {
      p_event_id: webhookId,
      p_event_type: supportedEvent.type,
      p_event_timestamp: eventTimestamp.toISOString(),
      p_user_id: userId,
      p_profile: profile,
    });

    if (error) {
      console.error("Clerk webhook database transaction failed:", { eventId: webhookId, eventType: supportedEvent.type, userId, error });
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error: unknown) {
    console.error("Unexpected Clerk webhook handler error:", { eventId: webhookId, eventType: supportedEvent.type, userId, error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
