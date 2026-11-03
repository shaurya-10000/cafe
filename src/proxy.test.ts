// proxy.test.ts
//
// Unit tests for the Next.js proxy boundary (proxy.ts).
//
// Strategy:
//   * @clerk/nextjs/server is mocked so we can capture the handler and the
//     options passed to clerkMiddleware, and so createRouteMatcher behaves
//     like Clerk's (pattern -> anchored regex on the pathname).
//   * next/server is NOT mocked: the real NextResponse.next() is used so the
//     header assertions run against the real Headers implementation.
//   * proxy.ts reads env and decodes the Clerk key at module load, so every
//     test re-imports a fresh module via vi.resetModules() + vi.stubEnv().

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Directives = Record<string, string[]>;
type AuthMock = { protect: ReturnType<typeof vi.fn> };
type RequestMock = { nextUrl: { pathname: string } };
type Handler = (auth: AuthMock, req: RequestMock) => Promise<Response>;
type MiddlewareOptions = {
  contentSecurityPolicy: { directives: Directives };
};

/* -------------------------------------------------------------------------- */
/* Clerk mock                                                                 */
/* -------------------------------------------------------------------------- */

const clerk = vi.hoisted(() => ({
  handler: undefined as unknown,
  options: undefined as unknown,
  patterns: undefined as unknown,
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler: unknown, options: unknown) => {
    clerk.handler = handler;
    clerk.options = options;
    return handler;
  },
  createRouteMatcher: (patterns: string[]) => {
    clerk.patterns = patterns;
    const compiled = patterns.map((pattern) => new RegExp(`^${pattern}$`));
    return (req: RequestMock) =>
      compiled.some((re) => re.test(req.nextUrl.pathname));
  },
}));

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const SUPABASE_URL = "https://abcdefgh.supabase.co";
const SUPABASE_WSS = "wss://abcdefgh.supabase.co";

const BASE_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
};

/** Builds a publishable key the way Clerk does: base64("<fapi-host>$"). */
const clerkKey = (host: string, prefix = "pk_test"): string =>
  `${prefix}_${btoa(`${host}$`)}`;

async function loadProxy(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries({ ...BASE_ENV, ...env })) {
    vi.stubEnv(key, value);
  }
  const mod = await import("./proxy");
  const options = clerk.options as MiddlewareOptions;
  return {
    mod,
    handler: clerk.handler as Handler,
    directives: options.contentSecurityPolicy.directives,
    options,
  };
}

function createAuth(): AuthMock {
  return { protect: vi.fn().mockResolvedValue(undefined) };
}

async function run(handler: Handler, pathname: string, auth = createAuth()) {
  const response = await handler(auth, { nextUrl: { pathname } });
  return { response, auth };
}

const BASE_DIRECTIVES: Directives = {
  "frame-ancestors": ["'none'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
    SUPABASE_URL,
    "https://img.clerk.com",
  ],
  "connect-src": [
    "'self'",
    SUPABASE_URL,
    SUPABASE_WSS,
    "https://clerk-telemetry.com",
    "https://challenges.cloudflare.com",
  ],
  "frame-src": [
    "'self'",
    "https://www.google.com",
    "https://maps.google.com",
    "https://challenges.cloudflare.com",
  ],
  "script-src": ["'self'", "https://challenges.cloudflare.com"],
};

const FAPI_DIRECTIVES = [
  "connect-src",
  "script-src",
  "frame-src",
  "img-src",
] as const;

beforeEach(() => {
  clerk.handler = undefined;
  clerk.options = undefined;
  clerk.patterns = undefined;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/* Module contract                                                            */
/* -------------------------------------------------------------------------- */

describe("module contract", () => {
  it("exports only a default middleware and a matcher config", async () => {
    const { mod } = await loadProxy();
    expect(Object.keys(mod).sort()).toEqual(["config", "default"]);
    expect(typeof mod.default).toBe("function");
  });

  it("registers the protected route trees with createRouteMatcher", async () => {
    await loadProxy();
    expect(clerk.patterns).toEqual([
      "/admin(.*)",
      "/customer(.*)",
      "/settings(.*)",
    ]);
  });
});

/* -------------------------------------------------------------------------- */
/* Environment validation                                                     */
/* -------------------------------------------------------------------------- */

describe("environment validation", () => {
  it("throws when NEXT_PUBLIC_SUPABASE_URL is empty", async () => {
    await expect(
      loadProxy({ NEXT_PUBLIC_SUPABASE_URL: "" })
    ).rejects.toThrow("Missing NEXT_PUBLIC_SUPABASE_URL.");
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is not a valid URL", async () => {
    await expect(
      loadProxy({ NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })
    ).rejects.toThrow();
  });

  it.each([
    ["http://127.0.0.1:54321", "ws://127.0.0.1:54321"],
    ["https://abcdefgh.supabase.co", "wss://abcdefgh.supabase.co"],
  ])("derives the realtime URL: %s -> %s", async (httpUrl, wsUrl) => {
    const { directives } = await loadProxy({
      NEXT_PUBLIC_SUPABASE_URL: httpUrl,
    });
    expect(directives["connect-src"]).toContain(new URL(httpUrl).origin);
    expect(directives["connect-src"]).toContain(wsUrl);
    expect(directives["img-src"]).toContain(new URL(httpUrl).origin);
  });
});

/* -------------------------------------------------------------------------- */
/* CSP directives                                                             */
/* -------------------------------------------------------------------------- */

describe("CSP directives", () => {
  it("matches the expected baseline exactly when no Clerk key is set", async () => {
    const { directives } = await loadProxy();
    expect(directives).toEqual(BASE_DIRECTIVES);
  });

  it("forbids framing the app", async () => {
    const { directives } = await loadProxy();
    expect(directives["frame-ancestors"]).toEqual(["'none'"]);
  });

  describe("Clerk FAPI host", () => {
    it.each([
      "clerk.cafe-example.com",
      "ample-cat-12.clerk.accounts.dev",
    ])("adds %s to every relevant directive", async (host) => {
      const { directives } = await loadProxy({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkKey(host),
      });
      const fapi = `https://${host}`;
      for (const name of FAPI_DIRECTIVES) {
        expect(directives[name]).toContain(fapi);
        expect(directives[name].at(-1)).toBe(fapi);
      }
      expect(directives["frame-ancestors"]).toEqual(["'none'"]);
    });

    it("supports live publishable keys", async () => {
      const { directives } = await loadProxy({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkKey("clerk.live.dev", "pk_live"),
      });
      expect(directives["connect-src"]).toContain("https://clerk.live.dev");
    });

    it.each([
      ["an empty key", ""],
      ["a key with too few segments", "pk_test"],
      ["an empty payload", "pk_test_"],
      ["a payload that is not base64", "pk_test_%%%"],
      ["a host without a dot", clerkKey("localhost")],
      ["a host containing a path", clerkKey("evil.com/path")],
      ["a host containing a port", clerkKey("clerk.dev:8080")],
      ["a host containing whitespace", clerkKey("clerk .dev")],
      ["a whitespace-only host", clerkKey("   ")],
    ])("ignores %s", async (_label, key) => {
      const { directives } = await loadProxy({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: key,
      });
      expect(directives).toEqual(BASE_DIRECTIVES);
    });
  });

  describe("policy hygiene", () => {
    it("never contains wildcards or unsafe keywords", async () => {
      const { directives } = await loadProxy({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkKey("clerk.cafe-example.com"),
      });
      const allowed =
        /^('self'|'none'|data:|blob:|(https|wss|ws):\/\/[^\s*]+)$/;
      for (const sources of Object.values(directives)) {
        for (const source of sources) {
          expect(source).not.toContain("*");
          expect(source).not.toMatch(/unsafe-(inline|eval)/);
          expect(source).toMatch(allowed);
        }
      }
    });

    it("has no duplicate sources within a directive", async () => {
      const { directives } = await loadProxy({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkKey("clerk.cafe-example.com"),
      });
      for (const sources of Object.values(directives)) {
        expect(new Set(sources).size).toBe(sources.length);
      }
    });
  });
});

/* -------------------------------------------------------------------------- */
/* Handler: authentication                                                    */
/* -------------------------------------------------------------------------- */

describe("handler: optimistic auth redirect", () => {
  const PROTECTED = [
    "/admin",
    "/admin/menu",
    "/customer",
    "/customer/orders/42",
    "/settings",
    "/settings/profile",
  ];
  const PUBLIC = ["/", "/menu", "/sign-in", "/locations", "/api/orders"];

  it.each(PROTECTED)("protects %s", async (path) => {
    const { handler } = await loadProxy();
    const { auth } = await run(handler, path);
    expect(auth.protect).toHaveBeenCalledTimes(1);
  });

  it.each(PUBLIC)("does not protect %s", async (path) => {
    const { handler } = await loadProxy();
    const { auth } = await run(handler, path);
    expect(auth.protect).not.toHaveBeenCalled();
  });

  it("propagates a rejection from auth.protect() and returns no response", async () => {
    const { handler } = await loadProxy();
    const auth = createAuth();
    auth.protect.mockRejectedValueOnce(new Error("redirect-to-sign-in"));
    await expect(
      handler(auth, { nextUrl: { pathname: "/admin" } })
    ).rejects.toThrow("redirect-to-sign-in");
  });
});

/* -------------------------------------------------------------------------- */
/* Handler: response + security headers                                       */
/* -------------------------------------------------------------------------- */

describe("handler: response", () => {
  const EXPECTED_HEADERS: Array<[string, string]> = [
    ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
    ["X-Frame-Options", "DENY"],
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    [
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(self), payment=()",
    ],
    ["Cross-Origin-Opener-Policy", "same-origin-allow-popups"],
    ["X-DNS-Prefetch-Control", "off"],
  ];

  it.each(["/", "/admin/menu"])(
    "passes the request through (no redirect) on %s",
    async (path) => {
      const { handler } = await loadProxy();
      const { response } = await run(handler, path);
      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("location")).toBeNull();
    }
  );

  describe.each(["/", "/admin/menu"])("security headers on %s", (path) => {
    it.each(EXPECTED_HEADERS)("sets %s", async (name, value) => {
      const { handler } = await loadProxy();
      const { response } = await run(handler, path);
      expect(response.headers.get(name)).toBe(value);
    });
  });

  it("does not opt the app into HSTS preload", async () => {
    const { handler } = await loadProxy();
    const { response } = await run(handler, "/");
    expect(response.headers.get("Strict-Transport-Security")).not.toContain(
      "preload"
    );
  });

  it("keeps geolocation same-origin only and camera/mic/payment disabled", async () => {
    const { handler } = await loadProxy();
    const { response } = await run(handler, "/");
    const policy = response.headers.get("Permissions-Policy") ?? "";
    expect(policy).toContain("geolocation=(self)");
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("payment=()");
  });

  it("returns a fresh response per request", async () => {
    const { handler } = await loadProxy();
    const first = await run(handler, "/");
    const second = await run(handler, "/");
    expect(first.response).not.toBe(second.response);
  });
});

/* -------------------------------------------------------------------------- */
/* Matcher config                                                             */
/* -------------------------------------------------------------------------- */

describe("config.matcher", () => {
  // The Next.js matcher sources are valid JS regex bodies, so anchoring them
  // is a faithful approximation of how Next evaluates them.
  async function loadMatchers() {
    const { mod } = await loadProxy();
    const compiled = mod.config.matcher.map((m: string) => new RegExp(`^${m}$`));
    return (path: string) => compiled.some((re: RegExp) => re.test(path));
  }

  it("declares exactly two matchers", async () => {
    const { mod } = await loadProxy();
    expect(mod.config.matcher).toHaveLength(2);
  });

  it.each([
    "/",
    "/admin",
    "/customer/orders",
    "/sign-in",
    "/api",
    "/api/orders",
    "/trpc/post.list",
    "/data.json",
    "/api/webhooks-evil",
    "/api/webhooks-evil/",
  ])("runs the middleware on %s", async (path) => {
    const runsOn = await loadMatchers();
    expect(runsOn(path)).toBe(true);
  });

  it.each([
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/api/webhooks",
    "/api/webhooks/stripe",
    "/api/webhooks/clerk",
    "/logo.png",
    "/images/hero.webp",
    "/fonts/inter.woff2",
    "/favicon.ico",
    "/styles/main.css",
  ])("skips the middleware on %s", async (path) => {
    const runsOn = await loadMatchers();
    expect(runsOn(path)).toBe(false);
  });
});