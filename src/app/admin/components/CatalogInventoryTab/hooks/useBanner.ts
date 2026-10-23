import { useCallback, useEffect, useState } from "react";

import { BANNER_TIMEOUT_MS } from "../constants";
import type { Banner } from "../types";

export interface UseBannerResult {
  banner: Banner;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  clearBanner: () => void;
}

/** A single status banner that dismisses itself. */
export function useBanner(): UseBannerResult {
  const [banner, setBanner] = useState<Banner>(null);

  useEffect(() => {
    if (!banner) return;

    const timer = setTimeout(() => setBanner(null), BANNER_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [banner]);

  const showError = useCallback(
    (message: string) => setBanner({ type: "error", message }),
    [],
  );

  const showSuccess = useCallback(
    (message: string) => setBanner({ type: "success", message }),
    [],
  );

  const clearBanner = useCallback(() => setBanner(null), []);

  return { banner, showError, showSuccess, clearBanner };
}
