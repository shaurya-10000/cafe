import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

const HANDLER_FLAG = Symbol.for("cafe.vitest.rejectionFilter");

/**
 * Harmless animation cancellation rejections can surface during component
 * teardown. Duck-typed because DOMException is not always `instanceof Error`.
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
 * Registered once per worker. The test config uses `isolate: false`, so this
 * file is evaluated repeatedly in the same process; a module-level function
 * reference would differ each time and listeners would accumulate.
 */
const registry = globalThis as Record<symbol, unknown>;

if (!registry[HANDLER_FLAG] && typeof process !== "undefined") {
  registry[HANDLER_FLAG] = true;

  process.on("unhandledRejection", (reason: unknown) => {
    if (isAnimationCancellation(reason)) return;
    throw reason;
  });
}
