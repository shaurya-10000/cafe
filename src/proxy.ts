// proxy.ts
//
// Next.js Proxy boundary.
//
// Responsibilities:
//   * Establish Clerk authentication context (clerkMiddleware).
//   * Apply baseline HTTP security headers, including CSP.
//   * Pass authorized requests to downstream handlers.
//
// Route protection is deliberately NOT done here. Clerk deprecated
// createRouteMatcher + middleware-level auth.protect() because path-based
// matching can diverge from how Next.js actually routes requests and leave
// protected resources reachable. The supported pattern is to check auth()
// inside each protected route/layout/server-action that accesses protected
// data. This app already does that in:
//
//   app/settings/layout.tsx   -> await auth() + redirect
//   app/customer/layout.tsx  -> await auth() + redirect
//   app/admin/layout.tsx      -> await auth() + redirect (plus role check)
//
// Server actions and route handlers additionally rely on RLS: the Supabase
// client is bound to the caller's Clerk session, and every mutating policy
// is enforced server-side at the database layer, so a request that somehow
// bypassed the route-level checks would still hit an authenticated,
// role-scoped policy.

import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/* Env                                                                        */
/* -------------------------------------------------------------------------- */
//
// TypeScript does not narrow `process.env.X` across module scope even when a
// top-level `if (!X) throw` proves X is defined. Bind each value to a
// `string`-typed const at module load so every downstream reference is
// unambiguously `string` — no non-null assertions, no casts, no `?.` chains.

const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!_supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
}
const supabaseUrl: string = _supabaseUrl;

// Realtime connects over a websocket, which needs its own connect-src entry
// distinct from the http(s):// origin used for REST/PostgREST calls.
// `http` -> `ws` and `https` -> `wss`, so a local Supabase (http://127.0.0.1)
// works in development as well as the hosted https project in production.
const supabaseRealtimeUrl: string = supabaseUrl.replace(/^http/, "ws");

// Supabase Storage public URLs are served from the same origin as the
// project — needed for catalog_items.media, business_locations.image_url,
// and any other Supabase-hosted image.
const supabaseOrigin: string = new URL(supabaseUrl).origin;

/* -------------------------------------------------------------------------- */
/* Clerk FAPI host                                                            */
/* -------------------------------------------------------------------------- */
//
// Clerk's SDK talks to its own Frontend API (FAPI) host — for example
// clerk.your-app.com in production, or <slug>.clerk.accounts.dev in dev.
// clerkMiddleware's `contentSecurityPolicy.directives` option MERGES the
// directives returned here with Clerk's own required directives (Clerk's
// docs: "your custom rules will be merged with Clerk's default security
// settings"), and Clerk already derives the FAPI host from the publishable
// key. Listing the host here as well is therefore redundant but harmless
// (duplicates in a source list are ignored), and it keeps the policy correct
// if a future Clerk version stops adding it automatically.
//
// The publishable key encodes the FAPI host as base64:
//   pk_test_<base64("clerk.host.com$")>  or  pk_live_<base64("clerk.host.com$")>

function decodeClerkFapiHost(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return null;

  const parts = key.split("_");
  // Format: pk_test_<payload> or pk_live_<payload>
  if (parts.length < 3) return null;
  const payload = parts[2];
  if (!payload) return null;

  try {
    // Base64 → ascii, then strip the trailing "$" Clerk appends.
    const decoded = atob(payload);
    const host = decoded.replace(/\$$/, "").trim();
    if (!host) return null;
    // Basic sanity check — a hostname must contain at least one dot and no
    // slashes, colons, or whitespace.
    if (!/^[a-z0-9.-]+\.[a-z0-9.-]+$/i.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

const clerkFapiHost = decodeClerkFapiHost();

/* -------------------------------------------------------------------------- */
/* CSP directives                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Build the app-specific CSP directives. Clerk merges these with its own
 * required directives, so this lists only what Clerk cannot know about:
 * Supabase, Unsplash, Google Maps.
 *
 * Verify after any Clerk / Next.js upgrade by loading the app with DevTools
 * open and checking the console for "Refused to ..." CSP violations.
 */
function buildCspDirectives(): Record<string, string[]> {
  const directives: Record<string, string[]> = {
    "frame-ancestors": ["'none'"],

    // AuthLayout decorative background + Supabase Storage public URLs +
    // Clerk avatar host (img.clerk.com).
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://images.unsplash.com",
      supabaseOrigin,
      "https://img.clerk.com",
    ],

    // Supabase REST + Supabase Realtime (ws/wss) + Clerk telemetry and its
    // Cloudflare bot-protection challenge host.
    "connect-src": [
      "'self'",
      supabaseOrigin,
      supabaseRealtimeUrl,
      "https://clerk-telemetry.com",
      "https://challenges.cloudflare.com",
    ],

    // LocationsSection embeds a Google Maps iframe on click-to-load; Clerk
    // embeds its own iframe for the bot-protection challenge.
    "frame-src": [
      "'self'",
      "https://www.google.com",
      "https://maps.google.com",
      "https://challenges.cloudflare.com",
    ],

    // Clerk's bot-protection challenge script.
    "script-src": ["'self'", "https://challenges.cloudflare.com"],
  };

  if (clerkFapiHost) {
    const fapi = `https://${clerkFapiHost}`;
    directives["connect-src"].push(fapi);
    directives["script-src"].push(fapi);
    directives["frame-src"].push(fapi);
    directives["img-src"].push(fapi);
  }

  return directives;
}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                 */
/* -------------------------------------------------------------------------- */

export default clerkMiddleware(
  async () => {
    const response = NextResponse.next();

    // Force HTTPS for a year once the browser has seen this header over
    // HTTPS. `preload` is deliberately omitted — preload requires an
    // explicit submission to the HSTS preload list and is not something a
    // library should opt an app into silently.
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );

    // CSP `frame-ancestors 'none'` (set via the directives above) is the
    // modern replacement for X-Frame-Options and takes precedence when both
    // are present. XFO is kept as defense in depth for legacy user-agents
    // that ignore CSP frame-ancestors.
    response.headers.set("X-Frame-Options", "DENY");

    // Prevents the browser from guessing a MIME type from content sniffing.
    response.headers.set("X-Content-Type-Options", "nosniff");

    // Send the full URL for same-origin navigations, but only the origin
    // for cross-origin requests.
    response.headers.set(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );

    // Geolocation is allowed for same-origin so the "Find Nearest" button
    // in LocationsSection works. Camera, mic, and payment remain disabled.
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(self), payment=()"
    );

    // COOP isolates the browsing context from cross-origin openers
    // ("tab-napping"). `same-origin-allow-popups` (rather than `same-origin`)
    // keeps that protection while still letting this app talk to popups it
    // opens itself — Clerk's social sign-in can use a popup flow, and
    // `same-origin` severs window.opener for those popups and breaks them.
    response.headers.set(
      "Cross-Origin-Opener-Policy",
      "same-origin-allow-popups"
    );

    // Opt out of speculative DNS prefetch on links the browser sees.
    response.headers.set("X-DNS-Prefetch-Control", "off");

    return response;
  },
  {
    // Clerk merges its own required CSP directives with whatever we return
    // here (see the note above buildCspDirectives).
    contentSecurityPolicy: {
      directives: buildCspDirectives(),
    },
  }
);

export const config = {
  matcher: [
    // Run on all routes except Next.js internals, static assets, and the
    // server-to-server webhook endpoints (which authenticate themselves).
    //
    // `/api/webhooks/` is excluded because Stripe, Clerk, and Supabase
    // Database Webhooks all call it directly with no browser session. They
    // verify their own signatures; Clerk middleware has nothing to do
    // there and just wastes a round-trip.
    "/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wav|mp3|ogg|m4a)).*)",

    // Matchers are OR-ed, so the API pattern needs the same exclusion. With
    // the stock `/(api|trpc)(.*)` pattern, /api/webhooks/* matched here even
    // though the pattern above excluded it, so the middleware still ran on
    // every webhook delivery.
    "/(api(?!/webhooks(?:/|$))|trpc)(.*)",
  ],
};