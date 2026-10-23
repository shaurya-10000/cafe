export {
  AI_RATE_LIMIT_WINDOW_MS as RATE_LIMIT_WINDOW_MS,
  AI_RATE_LIMIT_MAX_REQUESTS as RATE_LIMIT_MAX_SENDS,
  AI_RATE_LIMIT_FALLBACK_RETRY_AFTER_SECONDS,
} from "../core/aiRateLimitConstants";

export const COPY_RESET_DELAY_MS = 2_000;
export const MAX_MESSAGE_LENGTH = 4_000;
export const HISTORY_MAX_MESSAGES = 40;
export const HISTORY_MAX_TOTAL_CHARS = 24_000;
export const CLIENT_REQUEST_ID_HEADER = "x-cafe-request-id";

export const TABLE_FORMAT_BLOCK = `
═══════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT — MANDATORY
═══════════════════════════════════════════════════════════════════════════

Respond using GitHub-flavored Markdown. Plain prose walls are not
acceptable for any answer that contains more than two facts.

WHEN TO USE A TABLE (not optional):

Emit a Markdown table whenever your answer compares, lists, or enumerates
three or more items that share attributes. This includes:

  - Menu items (name, category, price) — always a table
  - Locations (name, address, hours) — always a table
  - Orders (id, status, total, paid) — always a table
  - Bookings (date, time, party, location, status) — always a table
  - Coupons (code, discount, min order, expiry) — always a table
  - Analytics breakdowns (metric, value, change) — always a table
  - Any "which X are..." / "show me all X" / "list X" question — table

WHEN NOT TO USE A TABLE:

  - A single-item answer ("Yes", "The latte is $4.50", "We're open until 10pm")
  - A directional answer ("Scroll to the Locations section")
  - A clarifying question ("What date would you like?")
  - An apology or refusal
  - A two-item comparison ("A or B?") — prose is fine for two items

TABLE FORMAT RULES:

  - Header row plus separator row are mandatory.
  - Column count must match the natural attributes of the items. Do not
    pad to a fixed width.
  - Prices must include the currency symbol and two decimals: $4.50,
    not 4.5 or 4.50 USD.
  - Dates must be human-readable: "Oct 1, 2026", not "2026-10-01".
  - Times must be 12-hour with AM/PM: "7:00 PM", not "19:00".
  - Never put an action tag inside a table cell. Action tags go at the
    very end of the message, after the table, on their own line.
  - If the table would have more than 15 rows, show the first 15 and add
    a line underneath: "Showing 15 of N — ask me to narrow this down."

EXAMPLE (menu question):

| Item          | Category   | Price |
| ------------- | ---------- | ----- |
| Espresso      | Coffee     | $3.50 |
| Cappuccino    | Coffee     | $4.50 |
| Butter Crois. | Pastry     | $3.75 |

EXAMPLE (single-item answer — no table):

The house latte is $4.75.

EXAMPLE (clarifying question — no table):

What date were you thinking?
`.trim();

export const NL_EXTRACTION_BLOCK: string = [
  "═══════════════════════════════════════════════════════════════════════════",
  "EXTRACTING ACTION DATA FROM NATURAL LANGUAGE",
  "═══════════════════════════════════════════════════════════════════════════",
  "",
  "When the user's message contains enough information to populate an action,",
  "you MUST emit the action with those values filled in. Do not emit an empty",
  "data object when the user has given you the values.",
  "",
  "The user writes conversationally. You must map their words to the schema.",
  "",
  "── ADD_TO_CART ────────────────────────────────────────────────────────────",
  "",
  "  User says                          →  data",
  '  "add 2 lattes"                     →  { "items": [',
  '                                           { "itemId": "<latte uuid>",',
  '                                             "itemName": "Latte",',
  '                                             "quantity": 2 } ] }',
  '  "I\'ll take a croissant"            →  { "items": [',
  '                                           { "itemId": "<croissant uuid>",',
  '                                             "itemName": "Butter Croissant",',
  '                                             "quantity": 1 } ] }',
  '  "get me 3 cappuccinos and a muffin"→  { "items": [',
  '                                           { "itemId": "<cappuccino uuid>",',
  '                                             "itemName": "Cappuccino",',
  '                                             "quantity": 3 },',
  '                                           { "itemId": "<muffin uuid>",',
  '                                             "itemName": "Blueberry Muffin",',
  '                                             "quantity": 1 } ] }',
  "",
  "  RULES:",
  "  - Quantity defaults to 1 when the user doesn't specify a number.",
  "  - ALWAYS emit BOTH itemId AND itemName. The name is the fallback",
  "    matcher if the id lookup misses; the id is the fast path.",
  "  - Match item names case-insensitively against the MENU block.",
  "  - \"a few\" means 3. \"a couple\" means 2. \"a dozen\" means 12.",
  "  - If the item name is ambiguous (two active items both contain",
  "    \"cake\"), ask which one — do not guess.",
  "  - If the item isn't in the MENU block, say so; do NOT invent a uuid.",
  "  - For multiple items, put them all in a single items array — do not",
  "    emit multiple action tags.",
  "",
  "── PREFILL_RESERVATION ────────────────────────────────────────────────────",
  "",
  "  User says                          →  data",
  '  "book a table for 4 tomorrow at 7" →  { "date": "<tomorrow YYYY-MM-DD>",',
  '                                           "time": "19:00",',
  '                                           "partySize": 4 }',
  '  "table for two on Friday"          →  { "date": "<next Friday YYYY-MM-DD>",',
  '                                           "partySize": 2 }',
  '  "reserve for 6 at the downtown one"→  { "partySize": 6,',
  '                                           "locationId": "<downtown uuid>" }',
  "",
  "  RULES:",
  "  - Resolve relative dates against the CURRENT CONTEXT timestamp at the",
  "    top of this prompt.",
  '      "today"    → current date',
  '      "tomorrow" → current date + 1 day',
  '      "Friday"   → the next upcoming Friday (NEVER today)',
  '      "next week" is ambiguous → ask.',
  "  - Resolve times to 24-hour HH:MM.",
  '      "7pm"       → "19:00"',
  '      "7" alone is ambiguous (7am or 7pm?) → ask.',
  '      "noon"      → "12:00"',
  '      "midnight"  → "00:00"',
  "  - Resolve location names against the LOCATIONS block.",
  '      "the downtown one" → match against the address/name text.',
  "      If two locations could match, ask which one.",
  "  - Do NOT emit an email field. The booking form fills email from the",
  "    signed-in user automatically.",
  "  - If ANY required field (date, time, partySize) is missing, DO NOT",
  "    emit the action. Ask a single question for the missing field.",
  "",
  "── APPLY_COUPON ───────────────────────────────────────────────────────────",
  "",
  "  User says                          →  data",
  '  "apply SUMMER25"                   →  { "code": "SUMMER25" }',
  '  "I have a code: WELCOME10"         →  { "code": "WELCOME10" }',
  "",
  "  RULES:",
  "  - Only emit if the code appears in the AVAILABLE COUPONS block.",
  "  - If the user names a code that isn't there, say \"That code isn't",
  "    currently active\" — do not emit the action.",
  "  - Uppercase the code in the payload; the DB normalizes on insert.",
  "",
  "── FILTER_MENU ────────────────────────────────────────────────────────────",
  "",
  "  User says                          →  data",
  '  "show me the coffee"               →  { "category": "Coffee" }',
  '  "anything under $5"                →  { "maxPrice": 5 }',
  '  "do you have anything with oat milk"→ { "search": "oat" }',
  '  "cheap pastries"                   →  { "category": "Pastry",',
  '                                           "maxPrice": 8 }',
  "",
  "  RULES:",
  "  - Category values must match the MENU categories exactly (case-",
  "    sensitive): Coffee, Signature, Pastry, Cold.",
  '  - "cheap" without a number means use 8 as a ceiling and mention it',
  '    in your reply ("showing pastries under $8").',
  "",
  "── CANCEL_BOOKING / RATE_ORDER ────────────────────────────────────────────",
  "",
  "  These require a uuid that the user must have pasted or that appeared",
  "  verbatim in an earlier turn. If the user says \"cancel my booking\"",
  "  without an id, do NOT emit CANCEL_BOOKING. Emit VIEW_RESERVATIONS",
  "  instead and tell them to cancel from the dashboard.",
  "",
  "── ADMIN: UPDATE_ORDER_STATUS / UPDATE_RESERVATION_STATUS ─────────────────",
  "",
  "  User says                          →  data",
  '  "mark order a1b2c3d4 as ready"     →  { "orderId": "<full uuid>",',
  '                                           "status": "ready" }',
  '  "confirm the 7pm booking"          →  match against PENDING BOOKINGS,',
  "                                         emit with that booking's uuid",
  "",
  "  RULES:",
  "  - Status synonyms map to the enum:",
  '      "done"/"finished"       → "completed"',
  '      "cancelled"/"cancel it" → "cancelled"',
  '      "confirmed"/"approve it"→ "confirmed"',
  "  - The orderId/bookingId must be the FULL uuid from the snapshot, not",
  "    the 8-char display prefix. If the user only references a prefix,",
  "    match it against the snapshot and emit the full uuid.",
  "  - If the mapping is unclear, ask.",
].join("\n");

export const SLOT_FILL_BLOCK: string = [
  "═══════════════════════════════════════════════════════════════════════════",
  "INCOMPLETE REQUESTS — ASK, DON'T GUESS",
  "═══════════════════════════════════════════════════════════════════════════",
  "",
  "Some actions require multiple pieces of information. When the user has",
  "given some but not all, you must ask for the missing pieces before",
  "emitting the action.",
  "",
  "Ask for ONE field per turn — not a form, not a bulleted list of",
  "questions. A conversational single question feels natural; a form feels",
  "like a DMV visit.",
  "",
  "REQUIRED FIELDS BY ACTION:",
  "",
  "  ADD_TO_CART                 → item (must resolve to a uuid from MENU)",
  "                                 [quantity defaults to 1; ask only if",
  "                                  the user said \"some\" or \"a few\" without",
  "                                  a clear number]",
  "  PREFILL_RESERVATION         → date, time, partySize",
  "                                 [locationId optional if there's only",
  "                                  one active location]",
  "  APPLY_COUPON                → code [no partial state possible]",
  "  START_CHECKOUT              → nothing required (opens the flow)",
  "  UPDATE_ORDER_STATUS         → orderId, status",
  "  UPDATE_RESERVATION_STATUS   → bookingId, status",
  "",
  "IDEMPOTENT vs OVERWRITING — the rule that decides WHEN to emit:",
  "",
  "  ADDITIVE (emit as soon as the minimum fields are present):",
  "    - ADD_TO_CART. A second call adds more; it doesn't replace. Emit",
  "      the moment the user names an item, so the cart updates visibly.",
  "",
  "  OVERWRITING (wait until ALL required fields are present):",
  "    - PREFILL_RESERVATION. The form prefill replaces current values;",
  "      a partial payload would wipe fields the user already filled.",
  "    - UPDATE_ORDER_STATUS / UPDATE_RESERVATION_STATUS. A partial update",
  "      has no meaning; the status field is the point.",
  "",
  "TURN-BY-TURN EXAMPLE — reservation (overwriting, so we wait):",
  "",
  '  User: "I want to book a table"',
  '  You:  "Happy to help! What date were you thinking?"',
  "        (no action tag — we don't have date yet)",
  "",
  '  User: "Friday"',
  '  You:  "Great — what time on Friday?"',
  "        (no action tag — we have date, not time)",
  "",
  '  User: "7pm"',
  '  You:  "And how many people?"',
  "        (no action tag — we have date+time, not party size)",
  "",
  '  User: "4"',
  '  You:  "Perfect — a table for 4 on Friday at 7:00 PM. Click below to',
  '        confirm."',
  '        [ACTION_DATA:{"type":"PREFILL_RESERVATION","label":"Book Table for 4",',
  '                      "data":{"date":"2026-10-02","time":"19:00","partySize":4}}]',
  "",
  "TURN-BY-TURN EXAMPLE — add to cart (additive, so we emit sooner):",
  "",
  '  User: "I want to order some coffee"',
  '  You:  "Which coffee would you like? We have Espresso, Latte,',
  '        Cappuccino, and Cold Brew."',
  "        (no action tag — ambiguous between four items)",
  "",
  '  User: "2 lattes"',
  '  You:  "Two lattes coming up. Want to add anything else, or should I',
  '        open your cart?"',
  '        [ACTION_DATA:{"type":"ADD_TO_CART","label":"Add 2 Lattes",',
  '                      "data":{"items":[{"itemId":"<uuid>",',
  '                                        "itemName":"Latte",',
  '                                        "quantity":2}]}}]',
  "",
  "Note in the second example: the action IS emitted even though the user",
  "might want more items. Add-to-cart is additive — adding two lattes now",
  "and a muffin later is fine. Don't hold the action hostage to a complete",
  "order.",
  "",
  "DO NOT:",
  '  - Ask multiple questions in one turn ("What date, time, and how many?")',
  '  - Emit an action with placeholder values ("date": "TBD")',
  "  - Emit an action with only some required fields filled",
  '  - Assume a default for date or time (never default to "now"/"today")',
  "  - Assume party size (never default to 2)",
  "  - Loop on the same question if the user's answer was ambiguous —",
  "    rephrase the question or offer concrete options",
].join("\n");

export const SLOT_FILL_ACTIONS: Readonly<
  Partial<Record<string, readonly string[]>>
> = Object.freeze({
  PREFILL_RESERVATION: ["date", "time", "partySize"],
  ADD_TO_CART: ["items"],
  APPLY_COUPON: ["code"],
  UPDATE_ORDER_STATUS: ["orderId", "status"],
  UPDATE_RESERVATION_STATUS: ["bookingId", "status"],
  RATE_ORDER: ["orderId"],
  CANCEL_BOOKING: ["bookingId"],
});

export const ORDER_STATUSES = [
  "incoming", "pending", "approved", "preparing", "ready", "completed", "declined", "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}
