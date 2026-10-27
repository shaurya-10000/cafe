import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Response header `X-Powered-By: Next.js` is removed. It costs nothing
  // and reduces the fingerprinting surface slightly.
  poweredByHeader: false,

  // React's strict mode double-invokes effects in dev, which catches
  // "missing cleanup" bugs early. Next.js has defaulted this to true since
  // v13.4, but explicit is better here — a future config change flipping
  // the default would silently disable it, and a lot of the effects in
  // this app (Realtime channels, event listeners, polling timers) rely on
  // strict mode to catch leaks.
  reactStrictMode: true,

  compiler: {
    // Removes console.* calls from production bundles to reduce bundle
    // size and TBT. Deliberately scoped to `log`/`debug`/`info` rather
    // than a bare `true` — a bare `true` strips `console.error` too, which
    // we DO want in production for genuine errors (failed webhooks,
    // Realtime disconnects, Supabase RLS surprises). The library-level
    // `console.error`/`console.warn` calls in this app are intentional
    // signals, not dev noise.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  images: {
    qualities: [60, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;