"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { useSupabaseClient } from "@/utils/supabase/client";
import type { UseChatPersistenceResult } from "@/components/ai/hooks/useChatPersistence";
import type { Message } from "@/components/ai/types";

import { MESSAGES } from "../constants";
import {
  buildRequestHeaders,
  createClientRequestId,
  errorDev,
  getBackpressureMessage,
  isAbortError,
  readChatStream,
  resolveRetryAfterSeconds,
  ensureStreamResponse,
  warnDev,
} from "../lib";
import { historyPayload } from "@/lib/ai/history";
import { ChatRequestError, readErrorBody } from "../lib/stream";
import { resolveChatTitle } from "../lib/title";
import type { BackpressureStatus } from "../types";

type Persistence = Pick<
  UseChatPersistenceResult,
  "persistUserMessage" | "updateSession" | "updateMessageByIndex"
>;

interface UseChatStreamOptions extends Persistence {
  isOpen: boolean;
  apiEndpoint: string;
  titleEndpoint: string;
  userId: string | null | undefined;
  supabase: ReturnType<typeof useSupabaseClient>;
  startCooldown: (seconds: number) => void;
}

export interface SendParams {
  chatId: string;
  text: string;
  /** The conversation so far, before this message. */
  history: readonly Message[];
}

/**
 * The network half of sending: optimistic user + empty assistant bubble,
 * first-message title generation, the streaming request, and 429/503
 * backpressure. A request id guards every async continuation, so a reply
 * that arrives after a newer send (or after the widget closed) is dropped.
 */
export function useChatStream({
  apiEndpoint,
  titleEndpoint,
  userId,
  supabase,
  startCooldown,
  persistUserMessage,
  updateSession,
  updateMessageByIndex,
}: UseChatStreamOptions) {
  const [loading, setLoading] = useState(false);

  const requestIdRef = useRef(0);
  const streamAbortRef = useRef<AbortController | null>(null);
  const titleAbortRef = useRef<AbortController | null>(null);

  const abortAll = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    titleAbortRef.current?.abort();
    titleAbortRef.current = null;
  }, []);

  // Abort in-flight work on unmount only. Closing the widget deliberately
  // does not abort: a reply that is still streaming finishes in the background.
  useEffect(() => abortAll, [abortAll]);


  const generateTitle = useCallback(
    async (
      chatId: string,
      firstMessage: string,
      clientRequestId: string,
    ) => {
      titleAbortRef.current?.abort();
      const controller = new AbortController();
      titleAbortRef.current = controller;

      try {
        const title = await resolveChatTitle({
          endpoint: titleEndpoint,
          firstMessage,
          clientRequestId,
          signal: controller.signal,
        });

        if (!title) return;

        updateSession(chatId, (session) => ({ ...session, title }));

        if (userId) {
          await supabase.from("chats").update({ title }).eq("id", chatId);
        }
      } catch (error) {
        if (isAbortError(error)) return;
        warnDev("[ChatWidget] Title generation failed:", error);
      }
    },
    [titleEndpoint, userId, supabase, updateSession],
  );

  const handleBackpressure = useCallback(
    async (
      res: Response,
      status: BackpressureStatus,
      chatId: string,
      assistantIndex: number,
      requestId: number,
    ) => {
      startCooldown(
        resolveRetryAfterSeconds(res.headers.get("Retry-After"), status),
      );

      const bodyText = await readErrorBody(res);
      if (requestId !== requestIdRef.current) return;

      updateMessageByIndex(chatId, assistantIndex, {
        text: bodyText || getBackpressureMessage(status),
        action: undefined,
      });
    },
    [startCooldown, updateMessageByIndex],
  );

  const send = useCallback(
    async ({ chatId, text, history }: SendParams) => {
      const requestId = ++requestIdRef.current;
      const clientRequestId = createClientRequestId(requestId);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        text,
      };
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "",
      };

      const updatedMessages = [...history, userMessage];
      const assistantIndex = updatedMessages.length;

      setLoading(true);

      updateSession(chatId, (session) => ({
        ...session,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: Date.now(),
      }));

      void persistUserMessage(chatId, text);

      const isFirstUserMessage = !history.some((m) => m.role === "user");
      if (isFirstUserMessage) {
        void generateTitle(chatId, text, clientRequestId);
      }

      streamAbortRef.current?.abort();
      const controller = new AbortController();
      streamAbortRef.current = controller;

      const partialReply: { current: Pick<Message, "text" | "action"> | null } = { current: null };

      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: buildRequestHeaders(clientRequestId),
          body: JSON.stringify({
            messages: historyPayload(updatedMessages),
            // Lets the API store the assistant reply in this chat. Signed-in
            // users only: guest history lives in localStorage.
            ...(userId ? { chatId } : {}),
          }),
          signal: controller.signal,
        });

        if (res.status === 429 || res.status === 503) {
          await handleBackpressure(
            res,
            res.status,
            chatId,
            assistantIndex,
            requestId,
          );
          return;
        }

        const body = await ensureStreamResponse(res);

        const result = await readChatStream(body, {
          isStale: () => requestId !== requestIdRef.current,
          onProgress: (progressText, action) => {
            partialReply.current = { text: progressText, action };
            updateMessageByIndex(chatId, assistantIndex, {
              text: progressText,
              action,
            });
          },
        });

        if (result && requestId === requestIdRef.current) {
          updateMessageByIndex(chatId, assistantIndex, {
            text: result.text,
            action: result.action,
          });
        }

        // The assistant reply is saved by the API route (it receives
        // `chatId`): the database only accepts browser-written user rows.
      } catch (error) {
        if (isAbortError(error)) return;
        if (requestId !== requestIdRef.current) return;

        errorDev("[ChatWidget] Stream error:", error);

        const received = partialReply.current;

        if (received?.text) {
          // Part of the reply already arrived: keep it, and say it was cut
          // off, instead of replacing a useful answer with an error.
          updateMessageByIndex(chatId, assistantIndex, {
            text: `${received.text}\n\n_(Connection lost. This reply may be incomplete.)_`,
            action: received.action,
          });
          return;
        }

        updateMessageByIndex(chatId, assistantIndex, {
          text:
            error instanceof ChatRequestError && error.message.trim()
              ? error.message
              : MESSAGES.connectFailed,
          action: undefined,
        });
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
      }
    },
    [
      apiEndpoint,
      userId,
      persistUserMessage,
      updateSession,
      updateMessageByIndex,
      generateTitle,
      handleBackpressure,
    ],
  );

  return { loading, send };
}