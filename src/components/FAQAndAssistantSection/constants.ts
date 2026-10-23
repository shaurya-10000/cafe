import type { FAQCategory } from "./types";

export const ALL_FAQ_CATEGORIES: readonly FAQCategory[] = [
  "dining",
  "orders",
  "reservations",
  "visit",
];

export const CHAT_CONFIG = {
  assistantType: "customer",
  apiEndpoint: "/api/ai/chat",
  titleEndpoint: "/api/ai/title",
  storageKey: "cafe_chats",
  headerTitle: "AI Concierge",
  emptyStateTitle: "Cafe Concierge",
  emptyStateSubtitle: "How may I assist your experience today?",
} as const;
