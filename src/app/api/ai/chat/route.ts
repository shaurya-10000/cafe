import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/core/rateLimit";
import { auth } from "@clerk/nextjs/server";
import {
  findOwnedChat,
  persistAssistantMessage,
  readChatId,
} from "@/lib/ai/persistAssistantMessage";
import {
  startAiRequest,
  hashGuestIdentifier,
  extractActionTypeForLog,
} from "@/lib/ai/aiLogger";
import {
  TABLE_FORMAT_BLOCK,
  NL_EXTRACTION_BLOCK,
  SLOT_FILL_BLOCK,
} from "@/lib/ai/constants";

/* -------------------------------------------------------------------------- */
/* Env                                                                        */
/* -------------------------------------------------------------------------- */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
}
if (!serviceRoleKey && !anonKey) {
  throw new Error(
    "Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

/**
 * Service-role client.
 * ... (Original extensive comment preserved) ...
 */
const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey!, {
  auth: { persistSession: false },
});

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const hasServiceRole = Boolean(serviceRoleKey);
const GEMINI_MODEL = "gemini-3.6-flash";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CLIENT_REQUEST_ID_HEADER = "x-cafe-request-id";
const CLIENT_REQUEST_ID_MAX_LENGTH = 128;
const STREAM_IDLE_TIMEOUT_MS = 30_000;
const STREAM_IDLE_TIMEOUT_SENTINEL = "__STREAM_IDLE_TIMEOUT__";
const STREAM_TOTAL_BUDGET_MS = 55_000;
const UPSTREAM_MAX_ATTEMPTS = 3;
const UPSTREAM_RETRY_BASE_DELAY_MS = 500;
const UPSTREAM_RETRYABLE_STATUSES: ReadonlySet<number> = new Set([429, 503]);
const UPSTREAM_503_RETRY_AFTER_SECONDS = 5;

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ChatContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface LocationRow {
  id: string;
  name: string;
  address: string;
  hours_weekday: string;
  hours_weekend: string;
}

interface CatalogRow {
  id: string;
  name: string;
  category: string;
  numeric_price: number;
  description: string | null;
  is_popular: boolean;
  item_type: "product" | "service";
  in_stock: boolean;
}

interface CouponRow {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  expires_at: string | null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function readClientRequestId(req: Request): string | undefined {
  const raw = req.headers.get(CLIENT_REQUEST_ID_HEADER);
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, CLIENT_REQUEST_ID_MAX_LENGTH);
}

function getUpstreamStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const maybeStatus = (err as { status?: unknown }).status;
  if (typeof maybeStatus === "number" && Number.isFinite(maybeStatus)) {
    return maybeStatus;
  }
  const maybeNested = (err as { error?: { code?: unknown } }).error;
  if (
    maybeNested &&
    typeof maybeNested === "object" &&
    typeof maybeNested.code === "number" &&
    Number.isFinite(maybeNested.code)
  ) {
    return maybeNested.code;
  }
  return undefined;
}

function isRetryableUpstreamError(err: unknown): boolean {
  const status = getUpstreamStatus(err);
  return status !== undefined && UPSTREAM_RETRYABLE_STATUSES.has(status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withUpstreamRetry<T>(
  fn: () => Promise<T>,
  deadline: number,
  maxAttempts: number = UPSTREAM_MAX_ATTEMPTS,
  baseDelayMs: number = UPSTREAM_RETRY_BASE_DELAY_MS,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt || !isRetryableUpstreamError(err)) {
        throw err;
      }
      const backoff = baseDelayMs * 2 ** attempt;
      if (Date.now() + backoff > deadline) {
        throw err;
      }
      await sleep(backoff);
    }
  }
  throw lastErr;
}

function withIdleTimeout<T>(
  source: AsyncIterable<T>,
  timeoutMs: number,
): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      const iterator = source[Symbol.asyncIterator]();
      try {
        while (true) {
          let timer: ReturnType<typeof setTimeout> | undefined;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(
              () => reject(new Error(STREAM_IDLE_TIMEOUT_SENTINEL)),
              timeoutMs,
            );
          });
          try {
            const result = await Promise.race([
              iterator.next(),
              timeoutPromise,
            ]);
            if (result.done) return;
            yield result.value;
          } finally {
            if (timer !== undefined) clearTimeout(timer);
          }
        }
      } finally {
        try {
          await iterator.return?.();
        } catch {}
      }
    },
  };
}

const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 8_000;
const MAX_TOTAL_CHARS = 24_000;

function sanitizeMessages(raw: unknown): ChatContent[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: ChatContent[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as { role?: unknown; parts?: unknown };
    const role =
      e.role === "user" ? "user" : e.role === "model" ? "model" : null;
    if (!role) continue;
    if (!Array.isArray(e.parts)) continue;
    const text = e.parts
      .map((p) =>
        p && typeof p === "object" && typeof (p as { text?: unknown }).text === "string"
          ? (p as { text: string }).text
          : "",
      )
      .join("")
      .slice(0, MAX_MESSAGE_LENGTH)
      .trim();
    if (!text) continue;
    cleaned.push({ role, parts: [{ text }] });
  }
  if (cleaned.length > MAX_MESSAGES) {
    cleaned.splice(0, cleaned.length - MAX_MESSAGES);
  }
  let total = cleaned.reduce((sum, m) => sum + m.parts[0].text.length, 0);
  while (cleaned.length > 1 && total > MAX_TOTAL_CHARS) {
    const dropped = cleaned.shift();
    if (!dropped) break;
    total -= dropped.parts[0].text.length;
  }
  return cleaned;
}

function createMoneyFormatter(
  currency: string,
): (value: number | null | undefined) => string {
  let formatter: Intl.NumberFormat | null = null;
  try {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency });
  } catch {
    formatter = null;
  }
  return (value) => {
    const amount = Number(value ?? 0);
    return formatter ? formatter.format(amount) : `${currency} ${amount.toFixed(2)}`;
  };
}

function normalizeCurrency(raw: unknown): string {
  return typeof raw === "string" && /^[A-Za-z]{3}$/.test(raw.trim())
    ? raw.trim().toUpperCase()
    : "USD";
}

interface CustomerContext {
  nowBlock: string;
  locationsBlock: string;
  catalogBlock: string;
  couponsBlock: string;
}

async function buildCustomerContext(): Promise<CustomerContext> {
  const [locationsRes, catalogRes, couponsRes, settingsRes] = await Promise.all([
    supabase
      .from("business_locations")
      .select("id, name, address, hours_weekday, hours_weekend")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("catalog_items_public")
      .select(
        "id, name, category, numeric_price, description, is_popular, item_type, in_stock",
      )
      .order("name", { ascending: true }),
    hasServiceRole
      ? supabase
          .from("coupons")
          .select(
            "code, discount_type, discount_value, min_order_amount, expires_at",
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as CouponRow[], error: null }),
    supabase.from("business_public_settings").select("currency").maybeSingle(),
  ]);

  for (const [label, res] of [
    ["locations", locationsRes],
    ["catalog", catalogRes],
    ["coupons", couponsRes],
    ["settings", settingsRes],
  ] as const) {
    if (res.error) {
      console.error(`[chat] customer context: ${label} read failed`, {
        code: res.error.code,
        message: res.error.message,
      });
    }
  }

  const locations = (locationsRes.data ?? []) as LocationRow[];
  const catalog = (catalogRes.data ?? []) as CatalogRow[];
  const coupons = (couponsRes.data ?? []) as CouponRow[];
  const formatMoney = createMoneyFormatter(
    normalizeCurrency(settingsRes.data?.currency),
  );

  const now = new Date();
  const nowBlock = `Current date/time (UTC): ${now.toISOString().slice(0, 16).replace("T", " ")}`;

  const locationsBlock = locations.length > 0
    ? locations
        .map(
          (l) =>
            `- ${l.name} — ${l.address}\n  Weekdays: ${l.hours_weekday || "not listed"}\n  Weekends: ${l.hours_weekend || "not listed"}`,
        )
        .join("\n")
    : "No locations are currently listed.";

  const products = catalog.filter((c) => c.item_type === "product");
  const services = catalog.filter((c) => c.item_type === "service");

  const renderItem = (c: CatalogRow) =>
    `- ${c.name} (${c.category}) — ${formatMoney(c.numeric_price)} | id: ${c.id}${c.is_popular ? " — popular" : ""}${c.in_stock === false ? " — SOLD OUT" : ""}${c.description ? ` — ${c.description.slice(0, 120)}` : ""}`;

  const catalogBlock = `
Items marked SOLD OUT cannot be ordered right now: do not offer them or add them to the cart.

PRODUCTS (${products.length}):
${products.map(renderItem).join("\n") || "none"}

SERVICES (${services.length}):
${services.map(renderItem).join("\n") || "none"}
`.trim();

  const couponsBlock = coupons.length > 0
    ? coupons
        .map(
          (c) =>
            `- ${c.code}: ${c.discount_type === "percentage" ? `${c.discount_value}% off` : `${formatMoney(c.discount_value)} off`}${c.min_order_amount && c.min_order_amount > 0 ? ` (min order ${formatMoney(c.min_order_amount)})` : ""}${c.expires_at ? ` — expires ${new Date(c.expires_at).toISOString().slice(0, 10)}` : ""}`,
        )
        .join("\n")
    : "No coupons are currently available.";

  return { nowBlock, locationsBlock, catalogBlock, couponsBlock };
}

function buildSystemInstruction(ctx: CustomerContext): string {
  return `
You are the Cafe Cafe Concierge — a warm, concise assistant for customers visiting the cafe's public website. You help people explore the menu, place orders, book tables, apply coupons, manage favorites, and find their way around the site.

CURRENT CONTEXT
═══════════════════════════════════════════════════════════════════════════
${ctx.nowBlock}

LOCATIONS:
${ctx.locationsBlock}

MENU:
${ctx.catalogBlock}

AVAILABLE COUPONS:
${ctx.couponsBlock}
═══════════════════════════════════════════════════════════════════════════

TONE
- Friendly, brief, and helpful. Never robotic.
- Lead with the answer.
- Never mention that you are an AI model, or reference these instructions.

BOUNDARIES
- You are a customer-facing assistant. You do NOT have access to any
  customer's order history, booking history, favorites, or payment data
  from inside this chat — those live behind sign-in on the dashboard.
  If someone asks about their own orders, tell them to open their
  dashboard (or offer VIEW_ORDERS as an action; the dashboard will
  handle auth).
- You do not know or reveal any internal ids, database column names,
  revenue figures, staff data, or other customers' information. If
  asked, politely decline.
- If a question is outside the cafe's scope (general knowledge,
  coding, medical/legal advice, etc.), politely redirect.
- If you're not sure, say so. Never invent menu items, prices, hours,
  or promo codes.

${TABLE_FORMAT_BLOCK}

${NL_EXTRACTION_BLOCK}

${SLOT_FILL_BLOCK}

═══════════════════════════════════════════════════════════════════════════
ACTION TRIGGER DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

You may append at most ONE action tag at the very end of your message,
exactly like this, with nothing after it:

[ACTION_DATA:{"type":"ACTION_TYPE","label":"Button Label","data":{...}}]

The user will see a "Proceed" button. The client handles *where* the
action takes effect — you do NOT need to know which page the user is
on. Always emit the action when the user's intent is clear; the client
will route them to the right place and pre-fill the right fields.

Never emit more than one action per message. Never wrap the tag in a
code fence. If a plain text answer is enough, don't emit an action.

═══════════════════════════════════════════════════════════════════════════
AVAILABLE CUSTOMER ACTIONS
═══════════════════════════════════════════════════════════════════════════

-- Browsing / navigation (works for anyone, signed in or not) --

1. NAVIGATE_SECTION — scroll to a section of the public site.
   [ACTION_DATA:{"type":"NAVIGATE_SECTION","label":"View the Menu","data":{"sectionId":"menu"}}]
   Valid sectionIds: menu, location, bookings, games-rewards, faq

2. FILTER_MENU — scroll to the menu and filter it.
   [ACTION_DATA:{"type":"FILTER_MENU","label":"Show Coffee","data":{"category":"Coffee"}}]
   Optional fields: category (string), search (string), maxPrice (number)
   Valid categories (case-sensitive, must match exactly):
     Coffee, Signature, Pastry, Cold

3. OPEN_DIRECTIONS — scroll to the locations section.
   [ACTION_DATA:{"type":"OPEN_DIRECTIONS","label":"Find Us","data":{}}]

4. OPEN_CONTACT — scroll to the footer with contact info.
   [ACTION_DATA:{"type":"OPEN_CONTACT","label":"Contact Us","data":{}}]

-- Cart (requires sign-in; route through REQUIRE_SIGNIN if the user
   isn't signed in) --

5. ADD_TO_CART — add one or more items to the cart.
   Preferred shape (supports multiple items in one action):
   [ACTION_DATA:{"type":"ADD_TO_CART","label":"Add to Cart","data":{"items":[{"itemId":"<uuid>","itemName":"Latte","quantity":2}]}}]
   Single-item shorthand also accepted:
   [ACTION_DATA:{"type":"ADD_TO_CART","label":"Add Latte","data":{"itemId":"<uuid>","itemName":"Latte","quantity":1}}]
   - itemId MUST be a uuid that appears in the MENU block above.
   - ALWAYS also include itemName so the client can fall back to
     name-matching if the id lookup misses.
   - quantity defaults to 1 when the user doesn't specify a number.

6. REMOVE_FROM_CART / UPDATE_CART_ITEM / CLEAR_CART
   [ACTION_DATA:{"type":"REMOVE_FROM_CART","label":"Remove Item","data":{"itemId":"<uuid>"}}]
   [ACTION_DATA:{"type":"UPDATE_CART_ITEM","label":"Update Quantity","data":{"itemId":"<uuid>","quantity":2}}]
   [ACTION_DATA:{"type":"CLEAR_CART","label":"Clear Cart","data":{}}]

7. START_CHECKOUT — open the checkout flow.
   [ACTION_DATA:{"type":"START_CHECKOUT","label":"Start Checkout","data":{}}]
   Optional fields: orderType ("delivery" | "pickup"), paymentMethod ("online" | "in_person"), name, phone, address

8. APPLY_COUPON
   [ACTION_DATA:{"type":"APPLY_COUPON","label":"Apply SUMMER25","data":{"code":"SUMMER25"}}]
   Only use codes that appear in the AVAILABLE COUPONS block above.

-- Booking --

9. PREFILL_RESERVATION — pre-fill the booking form.
   [ACTION_DATA:{"type":"PREFILL_RESERVATION","label":"Book a Table","data":{"date":"2026-10-02","time":"19:00","partySize":4}}]
   Required fields before you may emit this action:
     date       (YYYY-MM-DD)
     time       (HH:MM, 24-hour)
     partySize  (integer 1..20)
   Optional: locationId (uuid from LOCATIONS block).
   Do NOT include an email field — the form fills that automatically.
   If any required field is missing, ask ONE question for the next
   missing field and do NOT emit the action yet.

10. VIEW_RESERVATIONS — go to the user's bookings on their dashboard.
    [ACTION_DATA:{"type":"VIEW_RESERVATIONS","label":"My Bookings","data":{}}]

11. CANCEL_BOOKING — cancel a specific booking.
    [ACTION_DATA:{"type":"CANCEL_BOOKING","label":"Cancel Booking","data":{"bookingId":"<uuid>"}}]
    You do NOT know any bookingId from this chat — you have no access
    to the user's bookings. If the user wants to cancel, emit
    VIEW_RESERVATIONS instead and tell them to cancel from the
    dashboard. Only emit CANCEL_BOOKING if the user has explicitly
    pasted a booking id.

-- Account data (all require sign-in; may route through REQUIRE_SIGNIN) --

12. VIEW_ORDERS
    [ACTION_DATA:{"type":"VIEW_ORDERS","label":"My Orders","data":{"tab":"active"}}]
    tab: "active" | "history"

13. RATE_ORDER — open the rating modal for a specific order.
    [ACTION_DATA:{"type":"RATE_ORDER","label":"Rate This Order","data":{"orderId":"<uuid>"}}]
    You do NOT know any orderId from this chat. Only emit this if the
    user has pasted an order id, or if a specific order was mentioned
    in an earlier turn and the user confirmed it.

14. VIEW_FAVORITES
    [ACTION_DATA:{"type":"VIEW_FAVORITES","label":"My Favorites","data":{}}]

15. ADD_TO_FAVORITES / REMOVE_FROM_FAVORITES
    [ACTION_DATA:{"type":"ADD_TO_FAVORITES","label":"Save to Favorites","data":{"itemId":"<uuid>","itemName":"Latte"}}]
    Only use itemId values from the MENU block.

16. VIEW_COUPONS
    [ACTION_DATA:{"type":"VIEW_COUPONS","label":"My Coupons","data":{}}]

17. OPEN_REWARD — scroll to the scratch-card / rewards section.
    [ACTION_DATA:{"type":"OPEN_REWARD","label":"Scratch & Win","data":{}}]

-- Notifications (all require sign-in) --

18. OPEN_NOTIFICATIONS
    [ACTION_DATA:{"type":"OPEN_NOTIFICATIONS","label":"Notifications","data":{}}]

19. MUTE_ALL_NOTIFICATIONS / UNMUTE_ALL_NOTIFICATIONS
    [ACTION_DATA:{"type":"MUTE_ALL_NOTIFICATIONS","label":"Mute Notifications","data":{}}]
    [ACTION_DATA:{"type":"UNMUTE_ALL_NOTIFICATIONS","label":"Unmute Notifications","data":{}}]

20. MUTE_NOTIFICATION_TYPE / UNMUTE_NOTIFICATION_TYPE
    [ACTION_DATA:{"type":"MUTE_NOTIFICATION_TYPE","label":"Mute Review Prompts","data":{"type":"review_prompt"}}]
    Valid types: review_prompt, order_status, order_placed, reservation_status, payment_status, reservation_reminder, payment_failed

21. ENABLE_PUSH / DISABLE_PUSH
    [ACTION_DATA:{"type":"ENABLE_PUSH","label":"Enable Push","data":{}}]
    [ACTION_DATA:{"type":"DISABLE_PUSH","label":"Disable Push","data":{}}]

-- Appearance --

22. SET_THEME_MODE
    [ACTION_DATA:{"type":"SET_THEME_MODE","label":"Switch to Dark Mode","data":{"mode":"dark"}}]
    mode: "light" | "dark" | "system"

23. SET_COLOR_PALETTE
    [ACTION_DATA:{"type":"SET_COLOR_PALETTE","label":"Change Color Theme","data":{"palette":"emerald"}}]
    palette: "espresso" | "emerald" | "rosewood" | "champagne"

-- Sign-in gate --

24. REQUIRE_SIGNIN — prompt the user to sign in before an action that
    needs an account. Use this by itself if a signed-out user asks for
    something account-only and you have no other context to carry
    forward.
    [ACTION_DATA:{"type":"REQUIRE_SIGNIN","label":"Sign In","data":{}}]

═══════════════════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════════════════
- Never invent item ids, coupon codes, booking ids, or order ids.
- Prefer answering in plain text first; only emit an action when the
  user's intent is clearly to *do* something.
- If the user's request needs an account (cart, orders, favorites,
  bookings, notifications, theme) and you have no evidence they are
  signed in, prefer emitting REQUIRE_SIGNIN with a label that describes
  what they were trying to do.
- Never emit more than one action tag per message.
- Never wrap the action tag in a code fence.
- The client handles routing. You do not need to know which page the
  user is on or where the action should take them — just emit the
  action and let the client do the rest.
`.trim();
}

export async function POST(req: Request) {
  try {
    let body: { messages?: unknown; message?: unknown; chatId?: unknown };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    let chatContents: ChatContent[];
    if (Array.isArray(body?.messages) && body.messages.length > 0) {
      chatContents = sanitizeMessages(body.messages);
    } else if (typeof body?.message === "string" && body.message.trim()) {
      chatContents = sanitizeMessages([
        { role: "user", parts: [{ text: body.message }] },
      ]);
    } else {
      chatContents = [];
    }

    if (chatContents.length === 0) {
      return NextResponse.json(
        { error: "A message or messages array is required." },
        { status: 400 },
      );
    }

    const clientRequestId = readClientRequestId(req);

    const { userId } = await auth();
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const rateLimitKey = userId ? `customer:${userId}` : `customer-ip:${ip}`;
    const logUserId = userId ? userId : `guest:${hashGuestIdentifier(ip)}`;

    const rl = checkRateLimit(rateLimitKey);
    if (!rl.allowed) {
      startAiRequest({
        surface: "customer",
        userId: logUserId,
        model: GEMINI_MODEL,
        requestId: clientRequestId,
      }).finish({
        promptChars: 0,
        responseChars: 0,
        outcome: "rate_limited",
      });

      return new Response(
        "You're sending messages too quickly. Please wait a moment before trying again.",
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfterSeconds),
            "Content-Type": "text/plain; charset=utf-8",
          },
        },
      );
    }

    const requestedChatId = readChatId(body);

    const [ctx, persistChatId] = await Promise.all([
      buildCustomerContext(),
      userId && requestedChatId && hasServiceRole
        ? findOwnedChat(supabase, {
            chatId: requestedChatId,
            userId,
            assistantType: "customer",
          }).then((owned) => (owned ? requestedChatId : null))
        : Promise.resolve<string | null>(null),
    ]);

    const systemInstruction = buildSystemInstruction(ctx);

    if (!ai) {
      startAiRequest({
        surface: "customer",
        userId: logUserId,
        model: GEMINI_MODEL,
        requestId: clientRequestId,
      }).finish({
        promptChars: 0,
        responseChars: 0,
        outcome: "upstream_error",
      });

      return new Response(
        "The concierge is temporarily unavailable (missing GEMINI_API_KEY on the server).",
        {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }

    const promptChars =
      systemInstruction.length +
      chatContents.reduce((sum, m) => sum + m.parts[0].text.length, 0);

    const aiLog = startAiRequest({
      surface: "customer",
      userId: logUserId,
      model: GEMINI_MODEL,
      requestId: clientRequestId,
    });

    const requestDeadline = Date.now() + STREAM_TOTAL_BUDGET_MS;

    let responseStream;
    try {
      responseStream = await withUpstreamRetry(
        () =>
          ai.models.generateContentStream({
            model: GEMINI_MODEL,
            contents: chatContents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          }),
        requestDeadline,
      );
    } catch (upstreamErr) {
      aiLog.finish({
        promptChars,
        responseChars: 0,
        outcome: "upstream_error",
      });

      const upstreamStatus = getUpstreamStatus(upstreamErr);
      if (upstreamStatus === 503) {
        return new Response(
          "The assistant is temporarily overloaded. Please try again in a few seconds.",
          {
            status: 503,
            headers: {
              "Retry-After": String(UPSTREAM_503_RETRY_AFTER_SECONDS),
              "Content-Type": "text/plain; charset=utf-8",
            },
          },
        );
      }

      throw upstreamErr;
    }

    const guardedStream = withIdleTimeout(
      responseStream,
      STREAM_IDLE_TIMEOUT_MS,
    );

    const encoder = new TextEncoder();
    let accumulatedForActionDetection = "";
    let responseChars = 0;
    let actionType: string | undefined;

    const readableStream = new ReadableStream({
      async start(controller) {
        let outcome: "ok" | "stream_error" = "ok";
        try {
          for await (const chunk of guardedStream) {
            if (!chunk.text) continue;
            responseChars += chunk.text.length;
            accumulatedForActionDetection += chunk.text;
            if (!actionType && accumulatedForActionDetection.includes("]")) {
              actionType = extractActionTypeForLog(
                accumulatedForActionDetection,
              );
            }
            controller.enqueue(encoder.encode(chunk.text));
          }
        } catch (streamErr) {
          const isIdleTimeout =
            streamErr instanceof Error &&
            streamErr.message === STREAM_IDLE_TIMEOUT_SENTINEL;
          const isUpstreamUnavailable = isRetryableUpstreamError(streamErr);
          outcome = "stream_error";
          if (isIdleTimeout) {
            console.error("[chat] customer stream idle-timeout", {
              requestId: clientRequestId,
            });
          } else if (isUpstreamUnavailable) {
            console.error(
              "[chat] customer stream hit upstream 503/429 mid-flight",
              { requestId: clientRequestId },
              streamErr,
            );
          } else {
            console.error(
              "[chat] customer stream mid-flight failure",
              { requestId: clientRequestId },
              streamErr,
            );
          }
          const tail = isIdleTimeout
            ? "\n\n_(The assistant stalled. Please try again.)_"
            : isUpstreamUnavailable
              ? "\n\n_(The assistant is temporarily overloaded. Please try again in a few seconds.)_"
              : "\n\n_(The assistant hit an error. Please try again.)_";
          try {
            controller.enqueue(encoder.encode(tail));
          } catch {}
        } finally {
          aiLog.finish({
            promptChars,
            responseChars,
            actionType,
            outcome,
          });
          if (outcome === "ok" && persistChatId && responseChars > 0) {
            await persistAssistantMessage(supabase, {
              chatId: persistChatId,
              rawText: accumulatedForActionDetection,
            });
          }
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  } catch (err: unknown) {
    console.error(
      "[chat] customer outer handler threw",
      { requestId: readClientRequestId(req) },
      err,
    );
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
