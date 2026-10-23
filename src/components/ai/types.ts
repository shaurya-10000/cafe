import type { LucideIcon } from "lucide-react";
import type { ActionPayload } from "@/types/action";

export interface Message {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly action?: ActionPayload;
  readonly createdAt?: string;
}

export interface ChatSession {
  readonly id: string;
  readonly title: string;
  readonly isPinned: boolean;
  readonly messages: readonly Message[];
  readonly updatedAt: number;
}

export interface SuggestedPrompt {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly prompt: string;
}

export interface ChatWidgetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly apiEndpoint: string;
  readonly titleEndpoint: string;
  readonly storageKey: string;
  readonly assistantType: "customer" | "admin";
  readonly headerTitle: string;
  readonly emptyStateTitle: string;
  readonly emptyStateSubtitle: string;
  readonly suggestedPrompts: readonly SuggestedPrompt[];
  readonly accentGradientClassName?: string;
}

export interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  action: ActionPayload | null;
  created_at: string;
}

export interface ChatRow {
  id: string;
  title: string;
  is_pinned: boolean;
  updated_at: string;
  chat_messages: ChatMessageRow[] | null;
}