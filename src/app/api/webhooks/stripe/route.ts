import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY.");
if (!STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
if (!supabaseServiceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

const stripeSecret: string = STRIPE_SECRET_KEY;
const stripeWebhookSecret: string = STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
});

const supabaseAdmin = createServiceRoleClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const HANDLED_EVENT_TYPES: ReadonlySet<string> = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "charge.refunded",
  "charge.refund.updated",
  "refund.updated",
  "refund.failed",
  "charge.dispute.created",
  "charge.dispute.closed",
]);

interface ProcessStripeEventResult {
  status: "processed" | "ignored" | "duplicate" | "deferred" | "failed";
  event_id: string;
  detail?: string;
  error?: string;
  order_id?: string;
  payment_id?: string;
  previous_status?: string;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    return NextResponse.json({ received: true, eventId: event.id, status: "ignored", detail: "unhandled_event_type" });
  }

  const { data, error } = await supabaseAdmin.rpc("process_stripe_event", { p_event: event });

  if (error) {
    console.error("process_stripe_event RPC failed:", { eventId: event.id, eventType: event.type, error: error.message });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  const result = data as ProcessStripeEventResult | null;
  if (!result) {
    console.error("process_stripe_event returned no data:", { eventId: event.id, eventType: event.type });
    return NextResponse.json({ error: "Empty webhook response" }, { status: 500 });
  }

  if (result.status === "failed") {
    console.error("Stripe event processing failed:", { eventId: event.id, eventType: event.type, error: result.error });
    return NextResponse.json({ received: false, eventId: event.id, detail: result.error ?? "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, eventId: event.id, status: result.status, detail: result.detail ?? null });
}
