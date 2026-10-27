"use client";

import { useEffect, useRef } from "react";

import type { ChatSession } from "@/components/ai/types";

interface UseEnsureActiveChatOptions {
  isOpen: boolean;
  dbLoaded: boolean;
  sessions: readonly ChatSession[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  createNewChat: () => Promise<void>;
}

/**
 * While the widget is open, make sure there is always a usable conversation.
 *
 * - The conversation the user is in is kept: reopening the widget lands back
 *   on it, at its latest message.
 * - With no valid active chat (first open, or the open chat was deleted), an
 *   existing empty chat is reused, otherwise a new one is created.
 *
 * Reacts only to open / loaded / "has an active chat" changes; everything
 * else is read through a ref so a mid-session change never creates a stray chat.
 */
export function useEnsureActiveChat({
  isOpen,
  dbLoaded,
  sessions,
  activeChatId,
  setActiveChatId,
  createNewChat,
}: UseEnsureActiveChatOptions): void {
  const hasActiveChat =
    activeChatId !== null && sessions.some((session) => session.id === activeChatId);

  const latestRef = useRef({ sessions, setActiveChatId, createNewChat });

  // Declared before the main effect so it always runs first.
  useEffect(() => {
    latestRef.current = { sessions, setActiveChatId, createNewChat };
  });

  useEffect(() => {
    if (!isOpen || !dbLoaded || hasActiveChat) return;

    const { sessions, setActiveChatId, createNewChat } = latestRef.current;

    const existingEmpty = sessions.find((session) => session.messages.length === 0);

    if (existingEmpty) {
      setActiveChatId(existingEmpty.id);
    } else {
      void createNewChat();
    }
  }, [isOpen, dbLoaded, hasActiveChat]);
}