import { useCallback, useState } from "react";

import { getTodayDateString } from "../lib/dates";

/** Browser-local "today"; call `refresh` when a long-open page may have rolled over. */
export function useTodayDate(): { today: string; refresh: () => void } {
  const [today, setToday] = useState(() => getTodayDateString());

  const refresh = useCallback(() => {
    setToday(getTodayDateString());
  }, []);

  return { today, refresh };
}
