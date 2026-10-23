"use client";

import { useCallback } from "react";
import type { KeyboardEvent } from "react";

import type { ChatSession } from "@/components/ai/types";

import { SESSION_LIST_SELECTOR } from "../constants";
import { findMenuTrigger, findSessionButton } from "../lib/dom";
import { getNextSessionIndex } from "../lib/navigation";

interface UseSessionKeyboardOptions {
  sessions: readonly ChatSession[];
  onOpenMenu: (
    id: string,
    anchorRect: DOMRect,
    trigger: HTMLButtonElement,
  ) => void;
}

/**
 * Key handling for a focused session row.
 *
 *   Up / Down    move focus between sessions (wraps)
 *   Home / End   first / last session
 *   Delete       open the actions menu for the session
 *   Backspace    same as Delete (a Mac keyboard's "delete" key reports it)
 *
 * Delete opens the menu rather than deleting directly: a single keystroke
 * that permanently deletes history is hostile, and the menu is the same
 * entry point pointer users get, so both paths share one confirmation.
 *
 * The handler lives on the session <button> itself, so it only fires when a
 * session is focused; Up/Down inside the rename input or on the "…" button
 * keep their normal text-cursor / scroll behavior.
 */
export function useSessionKeyboard({
  sessions,
  onOpenMenu,
}: UseSessionKeyboardOptions) {
  return useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, sessionId: string) => {
      const container = event.currentTarget.closest(SESSION_LIST_SELECTOR);

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        if (!container) return;

        const trigger = findMenuTrigger(container, sessionId);
        if (!trigger) return;

        onOpenMenu(sessionId, trigger.getBoundingClientRect(), trigger);
        return;
      }

      if (sessions.length === 0) return;

      // Looked up by id, not DOM position, so it stays correct when pinned
      // sessions re-sort between render and key press.
      const currentIndex = sessions.findIndex((s) => s.id === sessionId);
      if (currentIndex === -1) return;

      const nextIndex = getNextSessionIndex(
        event.key,
        currentIndex,
        sessions.length,
      );
      if (nextIndex === null) return;

      // Stops the browser's own arrow-key scroll, which would otherwise
      // double up with the focus move.
      event.preventDefault();

      const next = sessions[nextIndex];
      if (!next || !container) return;

      findSessionButton(container, next.id)?.focus();
    },
    [sessions, onOpenMenu],
  );
}