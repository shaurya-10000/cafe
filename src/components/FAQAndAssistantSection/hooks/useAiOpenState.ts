import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

/**
 * Open/close state for the concierge that can be controlled by the parent.
 * `??` is intentional: `false` is a valid controlled value and must not fall
 * back to internal state.
 */
export function useAiOpenState(
  externalIsOpen: boolean | undefined,
  externalSetIsOpen: Dispatch<SetStateAction<boolean>> | undefined,
) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen ?? internalIsOpen;

  const setIsOpen = externalSetIsOpen ?? setInternalIsOpen;

  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  return { isOpen, open, close };
}
