import type { ChatSession } from "@/components/ai/types";

export const NEW_CHAT_TITLE = "New Conversation";
export const MAX_TITLE_LENGTH = 120;

/** History window loaded for signed-in users (newest chats / newest messages). */
export const MAX_CHATS_LOADED = 50;
export const MAX_MESSAGES_PER_CHAT = 200;

/** Caps for the guest localStorage copy, so it can never outgrow the quota. */
export const MAX_GUEST_CHATS = 30;
export const MAX_GUEST_MESSAGES_PER_CHAT = 100;

export const EMPTY_SESSIONS: readonly ChatSession[] = Object.freeze([]);