"use client";

import { useCallback, useState } from "react";

import type { ChatSession } from "@/components/ai/types";

/** Inline-rename state for the history list. */
export function useRenameChat(renameChat: (id: string, title: string) => void) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const startRename = useCallback((session: ChatSession) => {
    setEditingChatId(session.id);
    setEditingTitle(session.title);
  }, []);

  const commitRename = useCallback(() => {
    if (editingChatId) {
      renameChat(editingChatId, editingTitle);
    }
    setEditingChatId(null);
  }, [editingChatId, editingTitle, renameChat]);

  const cancelRename = useCallback(() => {
    setEditingChatId(null);
    setEditingTitle("");
  }, []);

  return {
    editingChatId,
    editingTitle,
    setEditingTitle,
    startRename,
    commitRename,
    cancelRename,
  };
}