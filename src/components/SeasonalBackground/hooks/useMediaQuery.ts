"use client";

import { useEffect, useState } from "react";
import { subscribeMql } from "../lib/mediaQuery";

/** Live media-query match. Returns `false` until `enabled` (post-mount). */
export function useMediaQuery(query: string, enabled: boolean): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const mql = window.matchMedia(query);

    const update = () => {
      setMatches(mql.matches);
    };

    update();

    return subscribeMql(mql, update);
  }, [query, enabled]);

  return matches;
}