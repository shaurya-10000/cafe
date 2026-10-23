import { useCallback, useState } from "react";

import type { Banner } from "../types";

export interface UseBannerResult {
  banner: Banner;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  clearBanner: () => void;
}

/** A single status banner, dismissed by the user or replaced by the next one. */
export function useBanner(): UseBannerResult {
  const [banner, setBanner] = useState<Banner>(null);

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
