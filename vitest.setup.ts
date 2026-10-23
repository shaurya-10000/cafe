import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

/**
 * Vitest can surface harmless animation cancellation rejections from
 * Framer Motion / browser animation APIs during component teardown.
 *
 * We intentionally ignore only the known cancellation cases.
 * Everything else is re-thrown so real application/test failures
 * are never hidden.
 */
function handleUnhandledRejection(reason: unknown): void {
  if (
    reason instanceof Error &&
    (reason.name === "AbortError" ||
      reason.message.includes("The animation was canceled"))
  ) {
    return;
  }

  throw reason;
}

/**
 * Prevent duplicate registration when this setup module is evaluated
 * repeatedly by the test runner.
 */
process.removeListener("unhandledRejection", handleUnhandledRejection);
process.on("unhandledRejection", handleUnhandledRejection);