import type { ActionPayload, ActionType, PartialActionState } from "@/types/action";
import { SLOT_FILL_ACTIONS } from "./constants";

export const SLOT_FILL_STATE_TTL_MS = 10 * 60 * 1_000;
const MAX_REPLY_LENGTH = 200;
const INTEGER_FIELDS: ReadonlySet<string> = new Set(["partySize", "quantity", "guests"]);
const NUMERIC_FIELDS: ReadonlySet<string> = new Set(["itemPrice", "maxPrice"]);

export type EvaluateResult = 
  | { readonly status: "dispatch"; readonly action: ActionPayload }
  | { readonly status: "collect"; readonly state: PartialActionState; readonly action: ActionPayload }
  | { readonly status: "passthrough"; readonly action: ActionPayload };

function startOfDay(d: Date): Date { const copy = new Date(d); copy.setHours(0, 0, 0, 0); return copy; }
function addDays(d: Date, n: number): Date { const copy = new Date(d); copy.setDate(copy.getDate() + n); return copy; }
function addMonths(d: Date, n: number): Date { const copy = new Date(d); copy.setMonth(copy.getMonth() + n); return copy; }
function formatDate(d: Date): string { const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0"); return `${y}-${m}-${day}`; }
function formatTime(hours: number, minutes: number): string { return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`; }
function parseWeekdayName(text: string): number | null { const map: Record<string, number> = { sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, thur: 4, thurs: 4, friday: 5, fri: 5, saturday: 6, sat: 6 }; return map[text] ?? null; }
function parseWordHour(text: string): number | null { const map: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }; return map[text] ?? null; }
function isValidCalendarDate(iso: string): boolean { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if (!m) return false; const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]); const date = new Date(y, mo - 1, d); return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d; }
function nextWeekday(from: Date, targetWeekday: number, skipThisWeek: boolean): Date { const currentWeekday = from.getDay(); let delta = (targetWeekday - currentWeekday + 7) % 7; if (delta === 0) { delta = 7; } else if (skipThisWeek) { delta += 7; } return addDays(from, delta); }
function resolveAbsoluteMonthDay(today: Date, monthIdx: number, day: number): string | null { const candidate = new Date(today.getFullYear(), monthIdx, day); if (candidate.getDate() !== day) return null; if (candidate < today) candidate.setFullYear(candidate.getFullYear() + 1); return formatDate(candidate); }

function parseDateString(raw: string, now: Date): string | null {
  const text = raw.trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return isValidCalendarDate(text) ? text : null;
  const today = startOfDay(now);
  if (text === "today" || text === "tonight") return formatDate(today);
  if (text === "tomorrow" || text === "tmr" || text === "tmrw") return formatDate(addDays(today, 1));
  if (text === "day after tomorrow" || text === "the day after tomorrow") return formatDate(addDays(today, 2));
  const inDaysMatch = /^in\s+(\d+)\s+days?$/.exec(text);
  if (inDaysMatch) { const n = Number(inDaysMatch[1]); if (Number.isInteger(n) && n >= 0 && n <= 365) return formatDate(addDays(today, n)); }
  if (text === "next week") return formatDate(addDays(today, 7));
  if (text === "next month") return formatDate(addMonths(today, 1));
  const weekdayIndex = parseWeekdayName(text);
  if (weekdayIndex !== null) return formatDate(nextWeekday(today, weekdayIndex, false));
  const nextWeekdayMatch = /^next\s+(\w+)$/.exec(text);
  if (nextWeekdayMatch) { const idx = parseWeekdayName(nextWeekdayMatch[1]); if (idx !== null) return formatDate(nextWeekday(today, idx, true)); }
  const onTheNthMatch = /^on\s+the\s+(\d{1,2})(?:st|nd|rd|th)?$/.exec(text);
  if (onTheNthMatch) { const day = Number(onTheNthMatch[1]); if (day >= 1 && day <= 31) { const candidate = new Date(today.getFullYear(), today.getMonth(), day); if (candidate.getDate() !== day) return null; if (candidate < today) candidate.setMonth(candidate.getMonth() + 1); return formatDate(candidate); } }
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec"];
  const nthOfMonthMatch = /^(\d{1,2})(?:st|nd|rd|th)?\s+of\s+(\w+)$/.exec(text);
  if (nthOfMonthMatch) { const day = Number(nthOfMonthMatch[1]); const monthIdx = monthNames.indexOf(nthOfMonthMatch[2]); if (monthIdx !== -1 && day >= 1 && day <= 31) return resolveAbsoluteMonthDay(today, monthIdx, day); }
  const monthNthMatch = /^(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?$/.exec(text);
  if (monthNthMatch) { const monthWord = monthNthMatch[1]; const day = Number(monthNthMatch[2]); let monthIdx = monthNames.indexOf(monthWord); if (monthIdx === -1) monthIdx = monthAbbr.indexOf(monthWord); if (monthIdx !== -1 && day >= 1 && day <= 31) return resolveAbsoluteMonthDay(today, monthIdx, day); }
  return null;
}

function parseTimeString(raw: string): string | null {
  const text = raw.trim().toLowerCase();
  if (text === "noon" || text === "midday") return "12:00";
  if (text === "midnight") return "00:00";
  const wordHour = parseWordHour(text);
  if (wordHour !== null) {
    const halfPastMatch = /^half\s+past\s+(\w+)$/.exec(text);
    if (halfPastMatch) { const h = parseWordHour(halfPastMatch[1]); if (h !== null) return formatTime(h, 30); }
    const quarterPastMatch = /^quarter\s+past\s+(\w+)$/.exec(text);
    if (quarterPastMatch) { const h = parseWordHour(quarterPastMatch[1]); if (h !== null) return formatTime(h, 15); }
    const quarterToMatch = /^quarter\s+to\s+(\w+)$/.exec(text);
    if (quarterToMatch) { const h = parseWordHour(quarterToMatch[1]); if (h !== null) return formatTime((h - 1 + 24) % 24, 45); }
    return null;
  }
  const withMeridiem = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)$/.exec(text);
  if (withMeridiem) { let h = Number(withMeridiem[1]); const m = withMeridiem[2] !== undefined ? Number(withMeridiem[2]) : 0; const isPm = withMeridiem[3].startsWith("p"); if (h < 1 || h > 12 || m < 0 || m > 59) return null; if (h === 12) h = isPm ? 12 : 0; else if (isPm) h += 12; return formatTime(h, m); }
  const colonForm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(text);
  if (colonForm) { const h = Number(colonForm[1]); const m = Number(colonForm[2]); if (h < 0 || h > 23 || m < 0 || m > 59) return null; if (colonForm[1].length === 1 && h >= 1 && h <= 11) return null; return formatTime(h, m); }
  const bareNumber = /^(\d{1,2})$/.exec(text);
  if (bareNumber) { const h = Number(bareNumber[1]); if (h >= 12 && h <= 23) return formatTime(h, 0); if (h === 0) return formatTime(0, 0); return null; }
  return null;
}

function parseCountString(raw: string): number | null {
  const text = raw.trim().toLowerCase();
  if (/^\d+$/.test(text)) { const n = Number(text); return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null; }
  if (text === "a couple" || text === "couple") return 2;
  if (text === "a few" || text === "few") return 3;
  if (text === "several") return 4;
  if (text === "a bunch" || text === "bunch") return 5;
  if (text === "a dozen" || text === "dozen") return 12;
  if (text === "half a dozen" || text === "half dozen") return 6;
  const wordToNumber: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20 };
  const word = wordToNumber[text];
  if (word !== undefined) return word;
  const tens = ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const ones = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const compoundMatch = /^(\w+)[\s-](\w+)$/.exec(text);
  if (compoundMatch) { const tensIdx = tens.indexOf(compoundMatch[1]); const onesIdx = ones.indexOf(compoundMatch[2]); if (tensIdx !== -1 && onesIdx !== -1) { const n = (tensIdx + 2) * 10 + (onesIdx + 1); return n <= 100 ? n : null; } }
  return null;
}

function normalizeCouponCode(raw: string): string | null { const cleaned = raw.trim().toUpperCase().replace(/\s+/g, ""); if (!cleaned) return null; if (!/^[A-Z0-9_-]{1,64}$/.test(cleaned)) return null; return cleaned; }

function coerceFieldValue(fieldName: string, raw: string, now: Date): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_REPLY_LENGTH) return null;
  if (fieldName === "date") return parseDateString(trimmed, now);
  if (fieldName === "time") return parseTimeString(trimmed);
  if (INTEGER_FIELDS.has(fieldName)) return parseCountString(trimmed);
  if (fieldName === "code") return normalizeCouponCode(trimmed);
  if (NUMERIC_FIELDS.has(fieldName)) { const n = Number(trimmed.replace(/[^0-9.]/g, "")); return Number.isFinite(n) && n >= 0 ? n : null; }
  return trimmed;
}

function findFirstMissingField(type: ActionType, collected: Record<string, unknown>): string | null {
  const required = SLOT_FILL_ACTIONS[type];
  if (!required || required.length === 0) return null;
  for (const field of required) {
    const value = collected[field];
    if (value === undefined || value === null) return field;
    if (typeof value === "string" && value.trim() === "") return field;
    if (Array.isArray(value) && value.length === 0) return field;
  }
  return null;
}

function extractData(action: ActionPayload): Record<string, unknown> { if (!action.data) return {}; return action.data as Record<string, unknown>; }

export function evaluateAction(action: ActionPayload, existingState: PartialActionState | null, now: Date = new Date()): EvaluateResult {
  const required = SLOT_FILL_ACTIONS[action.type];
  if (!required || required.length === 0) return { status: "passthrough", action };
  const usableState = clearExpiredState(existingState, now);
  const incomingData = extractData(action);
  const merged: Record<string, unknown> = usableState && usableState.type === action.type ? { ...usableState.collected, ...incomingData } : { ...incomingData };
  const missingField = findFirstMissingField(action.type, merged);
  if (missingField === null) {
    const completeAction = { ...action, data: merged } as ActionPayload;
    return { status: "dispatch", action: completeAction };
  }
  const state: PartialActionState = { type: action.type, collected: Object.freeze({ ...merged }), missingField, label: action.label, startedAt: usableState?.startedAt ?? now.getTime() };
  return { status: "collect", state, action };
}

export function mergeUserReply(state: PartialActionState, replyText: string, now: Date = new Date()): PartialActionState & { readonly lastParseFailed: boolean } {
  const coerced = coerceFieldValue(state.missingField, replyText, now);
  if (coerced === null) return Object.freeze({ ...state, lastParseFailed: true }) as PartialActionState & { readonly lastParseFailed: boolean };
  const nextCollected = Object.freeze({ ...state.collected, [state.missingField]: coerced });
  const nextMissing = findFirstMissingField(state.type, nextCollected);
  const nextState: PartialActionState = { type: state.type, collected: nextCollected, missingField: nextMissing ?? "", label: state.label, startedAt: state.startedAt };
  return Object.freeze({ ...nextState, lastParseFailed: false }) as PartialActionState & { readonly lastParseFailed: boolean };
}

export function clearExpiredState(state: PartialActionState | null, now: Date = new Date()): PartialActionState | null {
  if (!state) return null;
  const age = now.getTime() - state.startedAt;
  if (age < 0) return state;
  if (age > SLOT_FILL_STATE_TTL_MS) return null;
  return state;
}

export function assembleActionFromState(state: PartialActionState): ActionPayload | null {
  if (state.missingField !== "") return null;
  return { type: state.type, label: state.label, data: state.collected } as ActionPayload;
}

export function describeMissingField(type: ActionType, fieldName: string): string {
  const labels: Record<string, string> = { date: "What date would you like?", time: "What time works best?", partySize: "How many people will be joining?", locationId: "Which location would you prefer?", items: "What would you like to add?", itemId: "Which item would you like?", quantity: "How many would you like?", code: "What's the coupon code?", orderId: "Which order?", status: "What should the new status be?", bookingId: "Which booking?" };
  if (labels[fieldName]) return labels[fieldName];
  return `I need a ${fieldName} to finish setting up that ${type.replace(/_/g, " ").toLowerCase()}.`;
}

export const __test__ = { parseDateString, parseTimeString, parseCountString, normalizeCouponCode, coerceFieldValue, nextWeekday, isValidCalendarDate } as const;
