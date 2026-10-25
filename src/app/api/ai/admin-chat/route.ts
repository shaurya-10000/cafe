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
import { startAiRequest, extractActionTypeForLog } from "@/lib/ai/aiLogger";
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

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || anonKey!, {
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

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ChatContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface VerifiedAdmin {
  id: string;
  email: string | null;
}

interface OrderRow {
  id: string;
  status: string;
  total_amount: number | null;
  is_paid: boolean;
  order_type: string;
  payment_method: string;
  customer_name: string | null;
  created_at: string;
}

interface OrderAggRow {
  total_amount: number | null;
  status: string;
  created_at: string;
}

interface LocationRow {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

interface BookingRow {
  id: string;
  status: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  location_id: string;
}

interface CatalogRow {
  id: string;
  name: string;
  category: string;
  numeric_price: number;
  is_active: boolean;
  is_popular: boolean;
  item_type: "product" | "service";
}

interface CouponRow {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  used_count: number;
  usage_limit: number | null;
  is_active: boolean;
  expires_at: string | null;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

async function getVerifiedAdmin(): Promise<VerifiedAdmin | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .maybeSingle();
  if (error || !profile || profile.role !== "admin") return null;
  return {
    id: userId,
    email: (profile.email as string | null) ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* Live aggregation helpers                                                   */
/* -------------------------------------------------------------------------- */

function startOfDaysAgo(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
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

function formatUtcTimestamp(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "unknown time";
  return `${new Date(t).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

const ORDER_PAGE_SIZE = 1_000;
const MAX_ORDER_ROWS = 20_000;

interface OrderFetchResult {
  rows: OrderAggRow[];
  incomplete: boolean;
}

async function fetchOrdersSince(since: Date): Promise<OrderFetchResult> {
  const rows: OrderAggRow[] = [];
  let offset = 0;

  while (offset < MAX_ORDER_ROWS) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("total_amount, status, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + ORDER_PAGE_SIZE - 1);

    if (error) {
      console.error("[chat] admin order aggregation failed", {
        code: error.code,
        message: error.message,
      });
      return { rows, incomplete: true };
    }

    const page = (data ?? []) as OrderAggRow[];
    if (page.length === 0) return { rows, incomplete: false };
    rows.push(...page);
    offset += page.length;
  }

  return { rows, incomplete: true };
}

function formatCount(value: number | null | undefined): string {
  return String(Number(value ?? 0));
}

/* -------------------------------------------------------------------------- */
/* Context builders                                                           */
/* -------------------------------------------------------------------------- */

interface BusinessContext {
  todayBlock: string;
  weekBlock: string;
  monthBlock: string;
  recentOrdersBlock: string;
  locationsBlock: string;
  bookingsBlock: string;
  catalogBlock: string;
  couponsBlock: string;
}

async function buildBusinessContext(): Promise<BusinessContext> {
  const today = startOfToday();
  const week = startOfDaysAgo(7);
  const month = startOfDaysAgo(30);

  const [
    monthOrdersResult,
    recentOrdersRes,
    locationsRes,
    pendingBookingsRes,
    catalogRes,
    couponsRes,
    settingsRes,
  ] = await Promise.all([
    fetchOrdersSince(month),
    supabaseAdmin
      .from("orders")
      .select(
        "id, status, total_amount, is_paid, order_type, payment_method, customer_name, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(15),
    supabaseAdmin
      .from("business_locations")
      .select("id, name, address, is_active")
      .order("display_order", { ascending: true }),
    supabaseAdmin
      .from("bookings")
      .select(
        "id, status, party_size, booking_date, booking_time, location_id",
      )
      .in("status", ["pending", "confirmed"])
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
      .limit(20),
    supabaseAdmin
      .from("catalog_items")
      .select(
        "id, name, category, numeric_price, is_active, is_popular, item_type",
      )
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("coupons")
      .select(
        "id, code, discount_type, discount_value, used_count, usage_limit, is_active, expires_at",
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("business_settings")
      .select("currency")
      .eq("id", true)
      .maybeSingle(),
  ]);

  const monthOrders = monthOrdersResult.rows;
  const weekOrders = monthOrders.filter(
    (o) => Date.parse(o.created_at) >= week.getTime(),
  );
  const todayOrders = monthOrders.filter(
    (o) => Date.parse(o.created_at) >= today.getTime(),
  );
  const formatMoney = createMoneyFormatter(
    normalizeCurrency(settingsRes.data?.currency),
  );
  const ordersNote = monthOrdersResult.incomplete
    ? `NOTE: order figures may be incomplete (more than ${MAX_ORDER_ROWS.toLocaleString("en-US")} orders in 30 days, or a read failed). Say so if the user relies on these numbers.`
    : "";
  const withOrdersNote = (block: string) =>
    ordersNote ? `${block}\n- ${ordersNote}` : block;
  const recentOrders = (recentOrdersRes.data ?? []) as OrderRow[];
  const locations = (locationsRes.data ?? []) as LocationRow[];
  const pendingBookings = (pendingBookingsRes.data ?? []) as BookingRow[];
  const catalog = (catalogRes.data ?? []) as CatalogRow[];
  const coupons = (couponsRes.data ?? []) as CouponRow[];

  const locationNameById = new Map(locations.map((l) => [l.id, l.name]));

  const sumRevenue = (rows: OrderAggRow[]) =>
    rows.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);

  const countByStatus = (rows: OrderAggRow[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  };

  const todayRevenue = sumRevenue(todayOrders);
  const weekRevenue = sumRevenue(weekOrders);
  const monthRevenue = sumRevenue(monthOrders);
  const todayAov = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;
  const weekAov = weekOrders.length > 0 ? weekRevenue / weekOrders.length : 0;
  const todayStatuses = countByStatus(todayOrders);
  const weekStatuses = countByStatus(weekOrders);

  const todayBlock = `
TODAY (since ${today.toISOString().slice(0, 10)} 00:00 UTC):
- Orders: ${formatCount(todayOrders.length)}
- Revenue: ${formatMoney(todayRevenue)}
- Average order value: ${formatMoney(todayAov)}
- Status breakdown: ${Object.entries(todayStatuses).map(([s, c]) => `${s}: ${c}`).join(", ") || "none yet"}
`.trim();

  const weekBlock = `
LAST 7 DAYS:
- Orders: ${formatCount(weekOrders.length)}
- Revenue: ${formatMoney(weekRevenue)}
- Average order value: ${formatMoney(weekAov)}
- Status breakdown: ${Object.entries(weekStatuses).map(([s, c]) => `${s}: ${c}`).join(", ") || "none yet"}
`.trim();

  const monthBlock = `
LAST 30 DAYS:
- Orders: ${formatCount(monthOrders.length)}
- Revenue: ${formatMoney(monthRevenue)}
`.trim();

  const recentOrdersBlock = recentOrders.length > 0
    ? recentOrders
        .map(
          (o) =>
            `- #${o.id.slice(0, 8)} — ${o.status} — ${formatMoney(o.total_amount)} — ${o.order_type} — ${o.payment_method} — ${o.is_paid ? "paid" : "unpaid"} — ${formatUtcTimestamp(o.created_at)} [order_id: ${o.id}]`,
        )
        .join("\n")
    : "No orders on record.";

  const locationsBlock = locations.length > 0
    ? locations
        .map(
          (l) =>
            `- ${l.name} (${l.is_active ? "active" : "inactive"}) — ${l.address} [location_id: ${l.id}]`,
        )
        .join("\n")
    : "No locations configured.";

  const bookingsBlock = pendingBookings.length > 0
    ? pendingBookings
        .map(
          (b) =>
            `- ${b.booking_date} ${b.booking_time} — ${b.party_size} guests — ${locationNameById.get(b.location_id) ?? "unknown location"} — status: ${b.status} [booking_id: ${b.id}]`,
        )
        .join("\n")
    : "No pending or confirmed bookings.";

  const activeCatalog = catalog.filter((c) => c.is_active);
  const inactiveCatalog = catalog.filter((c) => !c.is_active);

  const catalogBlock = `
Active items: ${activeCatalog.length} (products: ${activeCatalog.filter((c) => c.item_type === "product").length}, services: ${activeCatalog.filter((c) => c.item_type === "service").length})
Inactive items: ${inactiveCatalog.length}

Sample of active items (first 10):
${
  activeCatalog
    .slice(0, 10)
    .map(
      (c) =>
        `- ${c.name} (${c.category}) — ${formatMoney(c.numeric_price)}${c.is_popular ? " — popular" : ""} [item_id: ${c.id}]`,
    )
    .join("\n") || "none"
}
`.trim();

  const couponsBlock = coupons.length > 0
    ? coupons
        .map(
          (c) =>
            `- ${c.code} — ${c.discount_type === "percentage" ? `${c.discount_value}%` : formatMoney(c.discount_value)} off — used ${c.used_count}/${c.usage_limit ?? "unlimited"} — ${c.is_active ? "active" : "disabled"}${c.expires_at ? ` — expires ${new Date(c.expires_at).toISOString().slice(0, 10)}` : ""} [coupon_id: ${c.id}]`,
        )
        .join("\n")
    : "No coupons configured.";

  return {
    todayBlock: withOrdersNote(todayBlock),
    weekBlock: withOrdersNote(weekBlock),
    monthBlock: withOrdersNote(monthBlock),
    recentOrdersBlock,
    locationsBlock,
    bookingsBlock,
    catalogBlock,
    couponsBlock,
  };
}

function buildSystemInstruction(admin: VerifiedAdmin, ctx: BusinessContext): string {
  return `
You are the Cafe Admin Assistant — an internal tool for signed-in cafe staff and owners. You are never used by customers.

VERIFIED IDENTITY: This request has been cryptographically confirmed as a signed-in admin (${admin.email ?? admin.id}). You do not need to ask who they are, and you do not need to verify their role.

═══════════════════════════════════════════════════════════════════════════
LIVE BUSINESS SNAPSHOT (pulled from the database at request time)
═══════════════════════════════════════════════════════════════════════════
${ctx.todayBlock}

${ctx.weekBlock}

${ctx.monthBlock}

RECENT ORDERS (last 15, most recent first):
${ctx.recentOrdersBlock}

PENDING / CONFIRMED BOOKINGS:
${ctx.bookingsBlock}

LOCATIONS:
${ctx.locationsBlock}

CATALOG:
${ctx.catalogBlock}

COUPONS:
${ctx.couponsBlock}
═══════════════════════════════════════════════════════════════════════════

KNOWN DATA LIMITATIONS — be upfront, don't guess around them:
- Orders are NOT linked to a specific location in the database. If asked which branch sold the most, or any per-location revenue question, say so plainly rather than inventing a number.
- The snapshot above is what exists in the database right now. If a user asks about a timeframe or metric not covered by today, 7 days, or 30 days, or about a dimension that isn't in the snapshot (hourly breakdowns, per-item revenue, etc.), say it isn't available in this chat and suggest they view the Analytics tab.
- Revenue means the sum of orders.total_amount. It includes both paid and unpaid orders, since the schema doesn't distinguish paid-revenue from placed-revenue at the summary level. If the user wants paid-only, tell them to filter by the Paid column in the Orders tab.

PRIVACY BOUNDARY (still applies to admins in this chat):
- Do not output individual customers' names, emails, or phone numbers here, even though you technically have access — that level of detail belongs in the dashboard tables, not a chat summary. Speak in aggregates and order/booking IDs. If a specific order requires customer detail, tell the user to open it in the Orders tab.

HOW TO ANSWER:
- Be direct and factual. Lead with the number.
- If a question is outside cafe operations, politely decline.
- If you're not sure, say so. Don't estimate.

${TABLE_FORMAT_BLOCK}

${NL_EXTRACTION_BLOCK}

${SLOT_FILL_BLOCK}

═══════════════════════════════════════════════════════════════════════════
ACTION TRIGGER DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

You may append at most ONE action tag at the very end of your message,
exactly like this, with nothing after it:

[ACTION_DATA:{"type":"ACTION_TYPE","label":"Button Label","data":{...}}]

The user will see a "Proceed" button and click it to run the action. The
client handles *where* the action takes effect — you do NOT need to know
which admin tab the user is on. Always emit the action when the user's
intent is clear; the client will route them to the right tab and apply
the change.

Never emit more than one action tag per message. Never wrap the tag in
a code fence. If a plain text answer is enough, don't emit an action.

═══════════════════════════════════════════════════════════════════════════
AVAILABLE ADMIN ACTIONS
═══════════════════════════════════════════════════════════════════════════

-- Navigation (safe, no confirmation) --

1. NAVIGATE_ADMIN — jump to a dashboard tab:
   [ACTION_DATA:{"type":"NAVIGATE_ADMIN","label":"Open Orders Tab","data":{"tab":"orders"}}]
   Valid tabs: orders, reservations, inventory, branches, analytics, coupons

2. NAVIGATE_SECTION — for going back to a public-facing section (rare from admin):
   [ACTION_DATA:{"type":"NAVIGATE_SECTION","label":"View Locations","data":{"sectionId":"location"}}]

-- Analytics (read-only, safe) --

3. VIEW_REVENUE / VIEW_ORDER_STATS / VIEW_TOP_ITEMS — open the Analytics
   tab pre-filtered to a range and metric:
   [ACTION_DATA:{"type":"VIEW_REVENUE","label":"Revenue Last 7 Days","data":{"range":"7d","metric":"revenue"}}]
   [ACTION_DATA:{"type":"VIEW_ORDER_STATS","label":"Order Count Today","data":{"range":"today","metric":"orders"}}]
   [ACTION_DATA:{"type":"VIEW_TOP_ITEMS","label":"Top Sellers","data":{"range":"30d","metric":"top_items"}}]
   Valid ranges: today, 7d, 30d, 90d, all
   Valid metrics: revenue, orders, aov, top_items, bottom_items

-- Order mutations (require explicit user intent + confirmation) --

4. UPDATE_ORDER_STATUS — change a single order's status:
   [ACTION_DATA:{"type":"UPDATE_ORDER_STATUS","label":"Mark Order Ready","data":{"orderId":"<uuid>","status":"ready"}}]
   Only emit this if the user has referenced a SPECIFIC order id from
   the RECENT ORDERS block above, or pasted one. Use the full uuid
   shown in the [order_id: ...] annotation, not the 8-char display prefix.
   Valid statuses: incoming, pending, approved, preparing, ready, completed, declined, refunded

5. TOGGLE_ORDER_PAID — flip an order's paid flag:
   [ACTION_DATA:{"type":"TOGGLE_ORDER_PAID","label":"Mark Order Paid","data":{"orderId":"<uuid>","isPaid":true}}]

-- Reservation mutations (require explicit user intent + confirmation) --

6. UPDATE_RESERVATION_STATUS — change a booking's status:
   [ACTION_DATA:{"type":"UPDATE_RESERVATION_STATUS","label":"Confirm Booking","data":{"bookingId":"<uuid>","status":"confirmed"}}]
   Only emit this if the user has referenced a SPECIFIC booking id from
   the PENDING / CONFIRMED BOOKINGS block above, or pasted one.
   Valid statuses: pending, confirmed, completed, cancelled

-- Catalog / branch / coupon toggles (require explicit user intent) --

7. TOGGLE_ITEM_ACTIVE — flip a catalog item's active flag:
   [ACTION_DATA:{"type":"TOGGLE_ITEM_ACTIVE","label":"Toggle Item Availability","data":{"id":"<uuid>"}}]

8. TOGGLE_ITEM_POPULAR — flip a catalog item's popular flag:
   [ACTION_DATA:{"type":"TOGGLE_ITEM_POPULAR","label":"Toggle Item Popularity","data":{"id":"<uuid>"}}]

9. TOGGLE_BRANCH_ACTIVE — flip a branch's active flag:
   [ACTION_DATA:{"type":"TOGGLE_BRANCH_ACTIVE","label":"Toggle Branch Status","data":{"id":"<uuid>"}}]

10. TOGGLE_COUPON_ACTIVE — flip a coupon's active flag:
    [ACTION_DATA:{"type":"TOGGLE_COUPON_ACTIVE","label":"Toggle Coupon Status","data":{"id":"<uuid>"}}]

-- Game reward config --

11. UPDATE_GAME_REWARD — update the singleton scratch-card reward:
    [ACTION_DATA:{"type":"UPDATE_GAME_REWARD","label":"Update Reward","data":{"rewardKey":"scratch_card","title":"Free Coffee","promoCode":"SCRATCH10","discountValue":"10%","isActive":true}}]

═══════════════════════════════════════════════════════════════════════════
ACTION RULES
═══════════════════════════════════════════════════════════════════════════
- Never invent an order, booking, item, branch, or coupon id. If the
  user asks you to act on something you don't see in the snapshot,
  say so and offer NAVIGATE_ADMIN to the relevant tab so they can find it.
- Prefer NAVIGATE_ADMIN over a mutation when the user is exploring
  rather than asking for a specific change. "Show me the orders" is
  navigation. "Cancel order #a1b2c3d4" is a mutation.
- Mutations require the user to have explicitly asked for that change.
  Do not propose a mutation as a suggestion.
- The user will see a confirmation dialog before any mutation runs.
  Write the label accordingly (imperative: "Cancel Order", not
  "Would you like to cancel?").
- Never emit more than one action tag per message.
- Never wrap the action tag in a code fence.
- If a plain answer is sufficient, don't emit an action at all.
- The client handles routing. You do not need to know which tab the
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

    const admin = await getVerifiedAdmin();
    if (!admin) {
      startAiRequest({
        surface: "admin",
        userId: "unauthenticated",
        model: GEMINI_MODEL,
        requestId: clientRequestId,
      }).finish({
        promptChars: 0,
        responseChars: 0,
        outcome: "unauthenticated",
      });

      return new Response(
        "This assistant is only available to signed-in Cafe admins. Please sign in with an admin account to use it.",
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }

    const rl = checkRateLimit(`admin:${admin.id}`);
    if (!rl.allowed) {
      startAiRequest({
        surface: "admin",
        userId: admin.id,
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
      buildBusinessContext(),
      requestedChatId && hasServiceRole
        ? findOwnedChat(supabaseAdmin, {
            chatId: requestedChatId,
            userId: admin.id,
            assistantType: "admin",
          }).then((owned) => (owned ? requestedChatId : null))
        : Promise.resolve<string | null>(null),
    ]);

    const systemInstruction = buildSystemInstruction(admin, ctx);

    if (!ai) {
      startAiRequest({
        surface: "admin",
        userId: admin.id,
        model: GEMINI_MODEL,
        requestId: clientRequestId,
      }).finish({
        promptChars: 0,
        responseChars: 0,
        outcome: "upstream_error",
      });

      return new Response(
        "The admin assistant is temporarily unavailable (missing GEMINI_API_KEY on the server).",
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
      surface: "admin",
      userId: admin.id,
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
              temperature: 0.5,
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
      if (upstreamStatus === 429) {
        console.warn("[chat] upstream rate limited (429) after retries");
        return new Response(
          "The assistant has reached its usage limit for the moment. Please try again shortly.",
          {
            status: 429,
            headers: {
              "Retry-After": "30",
              "Content-Type": "text/plain; charset=utf-8",
            },
          },
        );
      }
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
            console.error(
              "[admin-chat] stream idle-timeout",
              { requestId: clientRequestId, userId: admin.id },
            );
          } else if (isUpstreamUnavailable) {
            console.error(
              "[admin-chat] stream hit upstream 503/429 mid-flight",
              { requestId: clientRequestId, userId: admin.id },
              streamErr,
            );
          } else {
            console.error(
              "[admin-chat] stream mid-flight failure",
              { requestId: clientRequestId, userId: admin.id },
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
            await persistAssistantMessage(supabaseAdmin, {
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
      "[admin-chat] outer handler threw",
      { requestId: readClientRequestId(req) },
      err,
    );
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
