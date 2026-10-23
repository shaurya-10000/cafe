import { useEffect, useState } from "react";
import { clampTimerDelay, getCurrentYear, msUntilNextYear } from "../lib/year";

/** Current year, rolled over automatically if the page stays open on Jan 1. */
export function useCurrentYear(): number {
  const [year, setYear] = useState(getCurrentYear);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = clampTimerDelay(msUntilNextYear() + 1_000);
      timeoutId = setTimeout(() => {
        setYear(getCurrentYear());
        schedule();
      }, delay);
    };

    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  return year;
}
