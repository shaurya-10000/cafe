"use client";

import { useCallback, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

import { MAX_MESSAGE_LENGTH } from "@/lib/ai/constants";
import type { ChatSession } from "@/components/ai/types";
import type { ActionPayload } from "@/types/action";

import type { ConsumeReplyResult, UsePendingActionResult } from "../types";
import type { SendParams } from "./useChatStream";

interface UseChatComposerOptions {
  loading: boolean;
  activeChatId: string | null;
  sessions: readonly ChatSession[];
  canSend: boolean;
  tryConsume: () => { ok: true } | { ok: false; retryAfter: number };
  startCooldown: (seconds: number) => void;
  pendingState: UsePendingActionResult["pendingState"];
  consumeReply: (replyText: string) => ConsumeReplyResult;
  dispatchAction: (action: ActionPayload) => void;
  setSlotHint: (hint: string | null) => void;
  send: (params: SendParams) => Promise<void>;
}

/**
 * The input half of sending: text state, validation, rate limiting, and the
 * slot-fill fast path.
 *
 * While a partial action is being collected, a message is routed through the
 * slot machine instead of the network:
 *   - "ready"  the reply completed the last field; dispatch the assembled action
 *   - "ask"    the reply filled a middle field; show the next prompt
 *   - "failed" the reply couldn't be coerced; show a rephrase prompt
 * `null` means nothing is pending and the normal send flow runs.
 */
export function useChatComposer({
  loading,
  activeChatId,
  sessions,
  canSend,
  tryConsume,
  startCooldown,
  pendingState,
  consumeReply,
  dispatchAction,
  setSlotHint,
  send,
}: UseChatComposerOptions) {
  const [input, setInput] = useState("");
  const [lastSentText, setLastSentText] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (customMessage?: string) => {
      const text = (customMessage ?? input).trim();

      if (!text || loading || !activeChatId || !canSend) return;
      if (text.length > MAX_MESSAGE_LENGTH) return;

      if (pendingState) {
        const result = consumeReply(text);

        if (result !== null) {
          setInput("");
          setLastSentText(text);

          if (result.status === "ready") {
            setSlotHint(null);
            dispatchAction(result.action);
            return;
          }

          // "ask" and "failed" both set a new prompt; the wording is already
          // produced by `consumeReply`.
          setSlotHint(result.prompt);
          return;
        }
      }

      const rateCheck = tryConsume();
      if (!rateCheck.ok) {
        startCooldown(rateCheck.retryAfter);
        return;
      }

      const history =
        sessions.find((session) => session.id === activeChatId)?.messages ?? [];

      setInput("");
      setLastSentText(text);
      setSlotHint(null);

      await send({ chatId: activeChatId, text, history });
    },
    [
      input,
      loading,
      activeChatId,
      canSend,
      pendingState,
      consumeReply,
      dispatchAction,
      setSlotHint,
      tryConsume,
      startCooldown,
      sessions,
      send,
    ],
  );

  const retry = useCallback(() => {
    if (!lastSentText || loading) return;
    void sendMessage(lastSentText);
  }, [lastSentText, loading, sendMessage]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInput(
        value.length > MAX_MESSAGE_LENGTH
          ? value.slice(0, MAX_MESSAGE_LENGTH)
          : value,
      );
    },
    [],
  );

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  return {
    input,
    lastSentText,
    sendMessage,
    retry,
    handleInputChange,
    handleInputKeyDown,
  };
}