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
 * When the widget opens (and history has loaded), reuse an existing empty
 * chat or create one, so the user always lands in a usable conversation.
 *
 * Runs only on `isOpen` / `dbLoaded` transitions; everything else is read
 * through a ref so a mid-session change never creates a stray chat.
 */
export function useEnsureActiveChat({
  isOpen,
  dbLoaded,
  sessions,
  activeChatId,
  setActiveChatId,
  createNewChat,
}: UseEnsureActiveChatOptions): void {
  const latestRef = useRef({
    sessions,
    activeChatId,
    setActiveChatId,
    createNewChat,
  });

  // Declared before the main effect so it always runs first.
  useEffect(() => {
    latestRef.current = { sessions, activeChatId, setActiveChatId, createNewChat };
  });

  useEffect(() => {
    if (!isOpen || !dbLoaded) return;

    const { sessions, activeChatId, setActiveChatId, createNewChat } =
      latestRef.current;

    const existingEmpty = sessions.find((s) => s.messages.length === 0);

    if (existingEmpty) {
      setActiveChatId(existingEmpty.id);
    } else if (sessions.length === 0 || activeChatId === null) {
      void createNewChat();
    }
  }, [isOpen, dbLoaded]);
}