import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

/**
 * Detects the harmless animation cancellation rejections that Framer Motion /
 * browser animation APIs can emit during component teardown.
 *
 * Duck-typed on purpose: cancellations are often DOMException objects, which
 * are not guaranteed to be `instanceof Error` in every test environment.
 */
function isAnimationCancellation(reason: unknown): boolean {
  if (typeof reason !== "object" || reason === null) return false;

  const { name, message } = reason as { name?: unknown; message?: unknown };

  return (
    name === "AbortError" ||
    (typeof message === "string" &&
      message.includes("The animation was canceled"))
  );
}

/**
 * Ignores only the known cancellation case. Everything else is re-thrown so
 * real application/test failures are never hidden.
 */
function handleUnhandledRejection(reason: unknown): void {
  if (isAnimationCancellation(reason)) return;

  throw reason;
}

/**
 * Prevent duplicate registration when this setup module is evaluated
 * repeatedly by the test runner.
 */
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.removeListener("unhandledRejection", handleUnhandledRejection);
  process.on("unhandledRejection", handleUnhandledRejection);
}
