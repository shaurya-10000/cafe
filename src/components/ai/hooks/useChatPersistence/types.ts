import type { useSupabaseClient } from "@/utils/supabase/client";

import type { ChatSession, Message } from "@/components/ai/types";

/** What the hook was doing when a database write failed. */
export type ChatPersistenceOperation =
  | "load"
  | "create"
  | "message"
  | "pin"
  | "rename"
  | "delete";

export interface UseChatPersistenceResult {
  readonly sessions: readonly ChatSession[];
  readonly activeChatId: string | null;
  readonly activeChat: ChatSession | undefined;
  readonly setActiveChatId: (id: string | null) => void;
  readonly createNewChat: () => Promise<void>;
  /**
   * Stores the USER's message. Assistant replies are deliberately not
   * persisted from the browser: since migration 0018 the database rejects
   * browser-written `assistant` rows, and the chat API route saves them
   * server-side (it receives `chatId` in the request body).
   */
  readonly persistUserMessage: (
    chatId: string,
    content: string,
  ) => Promise<boolean>;
  readonly updateSession: (
    chatId: string,
    patch: (session: ChatSession) => ChatSession,
  ) => void;
  readonly updateMessageByIndex: (
    chatId: string,
    index: number,
    patch: Partial<Message>,
  ) => void;
  readonly togglePin: (chatId: string) => void;
  readonly renameChat: (chatId: string, title: string) => void;
  readonly deleteChat: (chatId: string) => void;
  readonly dbLoaded: boolean;
}

export interface UseChatPersistenceOptions {
  readonly userId: string | null | undefined;
  readonly assistantType: "customer" | "admin";
  readonly storageKey: string;
  readonly supabase: ReturnType<typeof useSupabaseClient>;
  /**
   * Called when a database operation fails. The UI has already been rolled
   * back where that applies; use this to show a toast.
   */
  readonly onPersistError?: (operation: ChatPersistenceOperation) => void;
}