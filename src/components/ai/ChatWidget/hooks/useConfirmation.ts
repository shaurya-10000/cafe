"use client";

import { useCallback, useRef, useState } from "react";

import type { ActionPayload } from "@/types/action";

import type { ConfirmationRequest } from "../types";

/**
 * Promise bridge for the confirmation dialog: `request(action)` resolves true
 * or false once the user answers. A request superseded by a newer one
 * resolves false instead of hanging forever.
 */
export function useConfirmation() {
  const [pending, setPending] = useState<ConfirmationRequest | null>(null);
  const pendingRef = useRef<ConfirmationRequest | null>(null);

  const settle = useCallback((ok: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(ok);
  }, []);

  const request = useCallback((action: ActionPayload): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      pendingRef.current?.resolve(false);

      const next: ConfirmationRequest = { action, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const confirm = useCallback(() => settle(true), [settle]);
  const cancel = useCallback(() => settle(false), [settle]);

  return { pending, request, confirm, cancel };
}