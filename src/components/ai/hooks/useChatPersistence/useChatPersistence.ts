"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ChatRow, ChatSession, Message } from "@/components/ai/types";

import {
  EMPTY_SESSIONS,
  MAX_CHATS_LOADED,
  MAX_MESSAGES_PER_CHAT,
  MAX_TITLE_LENGTH,
  NEW_CHAT_TITLE,
} from "./constants";
import {
  generateId,
  mapChatRow,
  parseGuestSessions,
  reportDev,
  serializeGuestSessions,
} from "./lib";
import type {
  ChatPersistenceOperation,
  UseChatPersistenceOptions,
  UseChatPersistenceResult,
} from "./types";

/**
 * Chat history persistence.
 *
 * Two backends, chosen by auth state:
 *   - Signed in  → Supabase (`chats` + `chat_messages`), RLS-scoped to the
 *     caller's `user_id`. Browser writes are limited to the user's own
 *     messages and chat metadata; assistant replies are saved by the API.
 *   - Signed out → `localStorage`, keyed by `storageKey` so the customer and
 *     admin widgets don't share guest history.
 *
 * Identity safety: everything is keyed by `${userId ?? "anon"}:${assistantType}`.
 * `dbLoaded` is DERIVED from that key (`loadedKey === activeKey`), so the
 * instant the identity changes `dbLoaded` is false and no sessions are
 * exposed, which means one user's chats are never shown to, or written into
 * the guest storage of, another identity while the new data loads.
 *
 * Mutations (pin / rename / delete) are optimistic and roll back if the
 * database rejects them, reporting through `onPersistError`.
 */
export function useChatPersistence({
  userId,
  assistantType,
  storageKey,
  supabase,
  onPersistError,
}: UseChatPersistenceOptions): UseChatPersistenceResult {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // `undefined` means Clerk has not resolved yet: nothing to load.
  const activeKey =
    userId === undefined ? null : `${userId ?? "anon"}:${assistantType}`;
  const dbLoaded = activeKey !== null && loadedKey === activeKey;

  /* ---- Latest-value refs (so callbacks stay stable) --------------------- */

  const supabaseRef = useRef(supabase);
  const storageKeyRef = useRef(storageKey);
  const onErrorRef = useRef(onPersistError);
  const activeKeyRef = useRef(activeKey);
  const sessionsRef = useRef(sessions);
  const activeChatIdRef = useRef(activeChatId);
  const creatingRef = useRef(false);

  useEffect(() => {
    supabaseRef.current = supabase;
    storageKeyRef.current = storageKey;
    onErrorRef.current = onPersistError;
    activeKeyRef.current = activeKey;
  });

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const fail = useCallback(
    (operation: ChatPersistenceOperation, error: unknown) => {
      reportDev(`Chat ${operation} error:`, error);
      onErrorRef.current?.(operation);
    },
    [],
  );

  /* ------------------------------------------------------------------------ */
  /* Initial load (re-runs only when the identity changes)                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (activeKey === null) return;

    let cancelled = false;

    // Drop whatever belonged to the previous identity before anything new
    // is shown or written.
    setSessions([]);
    setActiveChatId(null);

    // ── Guest path: localStorage ──────────────────────────────────────
    if (!userId) {
      let loaded: ChatSession[] = [];
      try {
        const saved = localStorage.getItem(storageKeyRef.current);
        loaded = saved ? parseGuestSessions(JSON.parse(saved)) : [];
      } catch {
        loaded = [];
      }

      setSessions(loaded);
      setActiveChatId(loaded[0]?.id ?? null);
      setLoadedKey(activeKey);
      return;
    }

    // ── Signed-in path: Supabase ──────────────────────────────────────
    void (async () => {
      const { data, error } = await supabaseRef.current
        .from("chats")
        .select(
          "id, title, is_pinned, updated_at, chat_messages(id, role, content, action, created_at)",
        )
        .eq("user_id", userId)
        .eq("assistant_type", assistantType)
        .order("updated_at", { ascending: false })
        .limit(MAX_CHATS_LOADED)
        // `foreignTable` works on every supabase-js v2; newer releases also
        // accept `referencedTable` and mark this name deprecated.
        .order("created_at", {
          foreignTable: "chat_messages",
          ascending: false,
        })
        .limit(MAX_MESSAGES_PER_CHAT, { foreignTable: "chat_messages" });

      if (cancelled) return;

      if (error) {
        fail("load", error);
        // Leave the (already cleared) state empty and let the UI continue
        // with a fresh chat instead of hanging on a spinner.
        setLoadedKey(activeKey);
        return;
      }

      const loaded = ((data ?? []) as unknown as ChatRow[]).map(mapChatRow);

      setSessions(loaded);
      setActiveChatId(loaded[0]?.id ?? null);
      setLoadedKey(activeKey);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeKey, userId, assistantType, fail]);

  /* ------------------------------------------------------------------------ */
  /* Guest persistence                                                        */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    // `dbLoaded` is identity-scoped, so this can never write a previous
    // user's sessions into the guest key.
    if (userId || !dbLoaded) return;

    try {
      localStorage.setItem(
        storageKeyRef.current,
        JSON.stringify(serializeGuestSessions(sessions)),
      );
    } catch {
      // Quota exceeded or storage disabled: history simply won't survive
      // a reload, which is acceptable for a guest.
    }
  }, [sessions, dbLoaded, userId]);

  /* ------------------------------------------------------------------------ */
  /* Session mutators                                                         */
  /* ------------------------------------------------------------------------ */

  const updateSession = useCallback(
    (chatId: string, patch: (session: ChatSession) => ChatSession) => {
      setSessions((prev) =>
        prev.map((session) => (session.id === chatId ? patch(session) : session)),
      );
    },
    [],
  );

  const updateMessageByIndex = useCallback(
    (chatId: string, index: number, patch: Partial<Message>) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== chatId) return session;
          const existing = session.messages[index];
          if (!existing) return session;

          const messages = [...session.messages];
          messages[index] = { ...existing, ...patch };
          return { ...session, messages, updatedAt: Date.now() };
        }),
      );
    },
    [],
  );

  /* ------------------------------------------------------------------------ */
  /* Create                                                                   */
  /* ------------------------------------------------------------------------ */

  const createNewChat = useCallback(async () => {
    // One creation at a time: StrictMode's doubled effects or a fast
    // open/close/open would otherwise insert duplicate empty chats.
    if (creatingRef.current) return;
    creatingRef.current = true;

    const keyAtStart = activeKeyRef.current;

    try {
      let created: ChatSession;

      if (userId) {
        const { data, error } = await supabaseRef.current
          .from("chats")
          .insert({
            user_id: userId,
            assistant_type: assistantType,
            title: NEW_CHAT_TITLE,
            is_pinned: false,
          })
          .select("id, updated_at")
          .single();

        if (error || !data) {
          fail("create", error);
          return;
        }

        created = {
          id: data.id as string,
          title: NEW_CHAT_TITLE,
          isPinned: false,
          messages: [],
          updatedAt: new Date(data.updated_at as string).getTime(),
        };
      } else {
        created = {
          id: generateId(),
          title: NEW_CHAT_TITLE,
          isPinned: false,
          messages: [],
          updatedAt: Date.now(),
        };
      }

      // The user may have signed out / switched while the insert was in
      // flight; never graft a chat onto a different identity.
      if (activeKeyRef.current !== keyAtStart) return;

      setSessions((prev) => [created, ...prev]);
      setActiveChatId(created.id);
    } finally {
      creatingRef.current = false;
    }
  }, [userId, assistantType, fail]);

  /* ------------------------------------------------------------------------ */
  /* Persist one user message                                                 */
  /* ------------------------------------------------------------------------ */

  const persistUserMessage = useCallback(
    async (chatId: string, content: string): Promise<boolean> => {
      if (!userId) return true; // Guests persist through localStorage.

      try {
        const { error: messageError } = await supabaseRef.current
          .from("chat_messages")
          .insert({
            chat_id: chatId,
            role: "user",
            content,
            action: null,
          });

        if (messageError) throw messageError;

        const { error: touchError } = await supabaseRef.current
          .from("chats")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", chatId);

        // The message itself is saved; a failed touch only affects sidebar
        // ordering, so it is logged but does not fail the call.
        if (touchError) reportDev("Chat touch error:", touchError);

        return true;
      } catch (error) {
        fail("message", error);
        return false;
      }
    },
    [userId, fail],
  );

  /* ------------------------------------------------------------------------ */
  /* Pin / rename / delete (optimistic, with rollback)                        */
  /* ------------------------------------------------------------------------ */

  const togglePin = useCallback(
    (chatId: string) => {
      const current = sessionsRef.current.find((s) => s.id === chatId);
      if (!current) return;

      // Derived from current state, not from inside a state updater:
      // React does not guarantee when an updater runs.
      const previous = current.isPinned;
      const next = !previous;

      setSessions((prev) =>
        prev.map((s) => (s.id === chatId ? { ...s, isPinned: next } : s)),
      );

      if (!userId) return;

      void (async () => {
        try {
          const { error } = await supabaseRef.current
            .from("chats")
            .update({ is_pinned: next })
            .eq("id", chatId);
          if (error) throw error;
        } catch (error) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === chatId ? { ...s, isPinned: previous } : s,
            ),
          );
          fail("pin", error);
        }
      })();
    },
    [userId, fail],
  );

  const renameChat = useCallback(
    (chatId: string, title: string) => {
      const trimmed = title.trim().slice(0, MAX_TITLE_LENGTH);
      if (!trimmed) return;

      const current = sessionsRef.current.find((s) => s.id === chatId);
      if (!current || current.title === trimmed) return;

      const previous = current.title;

      setSessions((prev) =>
        prev.map((s) => (s.id === chatId ? { ...s, title: trimmed } : s)),
      );

      if (!userId) return;

      void (async () => {
        try {
          const { error } = await supabaseRef.current
            .from("chats")
            .update({ title: trimmed })
            .eq("id", chatId);
          if (error) throw error;
        } catch (error) {
          setSessions((prev) =>
            prev.map((s) => (s.id === chatId ? { ...s, title: previous } : s)),
          );
          fail("rename", error);
        }
      })();
    },
    [userId, fail],
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      const index = sessionsRef.current.findIndex((s) => s.id === chatId);
      if (index < 0) return;

      const removed = sessionsRef.current[index];
      const wasActive = activeChatIdRef.current === chatId;
      const fallbackId =
        sessionsRef.current.find((s) => s.id !== chatId)?.id ?? null;

      setSessions((prev) => prev.filter((s) => s.id !== chatId));
      if (wasActive) setActiveChatId(fallbackId);

      if (!userId) return;

      void (async () => {
        try {
          const { error } = await supabaseRef.current
            .from("chats")
            .delete()
            .eq("id", chatId);
          if (error) throw error;
        } catch (error) {
          // Put the chat back where it was.
          setSessions((prev) => {
            if (prev.some((s) => s.id === chatId)) return prev;
            const next = [...prev];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          });
          if (wasActive) setActiveChatId(chatId);
          fail("delete", error);
        }
      })();
    },
    [userId, fail],
  );

  /* ------------------------------------------------------------------------ */
  /* Derived                                                                  */
  /* ------------------------------------------------------------------------ */

  const visibleSessions = dbLoaded ? sessions : EMPTY_SESSIONS;
  const visibleActiveChatId = dbLoaded ? activeChatId : null;

  const activeChat = useMemo(
    () => visibleSessions.find((s) => s.id === visibleActiveChatId),
    [visibleSessions, visibleActiveChatId],
  );

  return {
    sessions: visibleSessions,
    activeChatId: visibleActiveChatId,
    activeChat,
    setActiveChatId,
    createNewChat,
    persistUserMessage,
    updateSession,
    updateMessageByIndex,
    togglePin,
    renameChat,
    deleteChat,
    dbLoaded,
  };
}