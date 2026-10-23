import { useCallback, useState } from "react";

import type { GalleryDirection } from "../types";

export interface UseImageGalleryResult {
  imageIndexes: Readonly<Record<string, number>>;
  navigate: (
    itemId: string,
    direction: GalleryDirection,
    total: number,
  ) => void;
}

/** Tracks the visible image index per card. */
export function useImageGallery(): UseImageGalleryResult {
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});

  const navigate = useCallback(
    (itemId: string, direction: GalleryDirection, total: number): void => {
      if (total <= 0) return;

      setImageIndexes((prev) => {
        const current = prev[itemId] ?? 0;

        const next =
          direction === "next"
            ? (current + 1) % total
            : (current - 1 + total) % total;

        return { ...prev, [itemId]: next };
      });
    },
    [],
  );

  return { imageIndexes, navigate };
}
