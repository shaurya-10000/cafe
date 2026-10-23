import { useCallback, useRef } from "react";
import { getNextIndex } from "../lib/keyboard";
import type { FAQEntry, RowNavKey } from "../types";

/** Arrow/Home/End focus movement between accordion headers. */
export function useRowKeyboardNav(entries: readonly FAQEntry[]) {
  const buttonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  const registerButton = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) buttonsRef.current.set(id, node);
      else buttonsRef.current.delete(id);
    },
    [],
  );

  const navigate = useCallback(
    (currentId: string, key: RowNavKey) => {
      const currentIndex = entries.findIndex((entry) => entry.id === currentId);
      if (currentIndex === -1) return;

      const nextIndex = getNextIndex(
        key,
        currentIndex,
        entries.length,
        "vertical",
      );
      if (nextIndex === null) return;

      const nextEntry = entries[nextIndex];
      if (!nextEntry) return;

      const target = buttonsRef.current.get(nextEntry.id);
      if (target) {
        target.focus();
      } else if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[FAQ] Keyboard navigation target not registered: ${nextEntry.id}`,
        );
      }
    },
    [entries],
  );

  return { registerButton, navigate };
}
