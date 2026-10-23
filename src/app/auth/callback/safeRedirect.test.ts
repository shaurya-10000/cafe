import { describe, expect, it } from "vitest";
import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from "./safeRedirect";

const ORIGIN = "https://cafe.example";

describe("getSafeRedirectPath", () => {
  it.each([
    ["missing", null],
    ["empty", ""],
    ["absolute URL", "https://evil.example"],
    ["protocol-relative", "//evil.example"],
    ["slash-backslash", "/\\evil.example"],
    ["UNC path", "\\\\evil.example"],
    ["dot-segment bypass", "/.//evil.example"],
    ["dot-dot bypass", "/..//evil.example/x"],
    ["tab smuggling", "/\t/evil.example"],
    ["javascript scheme", "javascript:alert(1)"],
    ["bare word", "evil"],
  ])("falls back to the default for %s", (_label, input) => {
    expect(getSafeRedirectPath(input, ORIGIN)).toBe(DEFAULT_REDIRECT_PATH);
  });

  it.each([
    ["/settings", "/settings"],
    ["/settings?tab=profile#x", "/settings?tab=profile#x"],
    ["/dashboard?tab=history&rateOrder=42", "/dashboard?tab=history&rateOrder=42"],
    ["/a/../b", "/b"],
  ])("keeps the same-origin path %s", (input, expected) => {
    expect(getSafeRedirectPath(input, ORIGIN)).toBe(expected);
  });

  it("never returns a protocol-relative or non-rooted path", () => {
    const attempts = [
      "/.//evil.example",
      "/%2F/evil.example",
      "/..//a//b",
      "///evil.example",
      "/./\\evil.example",
    ];
    for (const attempt of attempts) {
      const result = getSafeRedirectPath(attempt, ORIGIN);
      expect(result.startsWith("/")).toBe(true);
      expect(result.startsWith("//")).toBe(false);
    }
  });
});
