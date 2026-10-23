"use client";

import { useCallback, useState } from "react";

import { COPY_RESET_DELAY_MS } from "@/lib/ai/constants";
import { useAutoClearingTimeout } from "@/components/ai/hooks/useAutoClearingTimeout";

import { warnDev } from "../lib/request";

/**
 * Copies a message and tracks which one shows the "Copied" state. The state
 * clears itself after COPY_RESET_DELAY_MS (the timer's `active` flag gates
 * it), so the check mark no longer sticks until the next copy.
 */
export function useCopyMessage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [active, startReset] = useAutoClearingTimeout(COPY_RESET_DELAY_MS);

  const copy = useCallback(
    async (messageId: string, text: string) => {
      if (!navigator.clipboard?.writeText) return;

      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(messageId);
        startReset();
      } catch (error) {
        warnDev("[ChatWidget] Clipboard copy failed:", error);
      }
    },
    [startReset],
  );

  return { copiedMessageId: active ? copiedId : null, copy };
}