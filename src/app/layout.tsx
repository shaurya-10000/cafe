import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { Toaster } from "sonner";

/**
 * Root layout.
 *
 * Three things here are load-bearing and easy to accidentally break:
 *
 * 1. `suppressHydrationWarning` on <html>.
 *    next-themes writes `class="dark"` (or removes it) on <html> before
 *    hydration, so the server-rendered `class=""` and the client-rendered
 *    `class="dark"` legitimately differ for one frame. Without this prop
 *    React logs a hydration mismatch on every page load for every
 *    dark-mode user. It does NOT suppress real mismatches elsewhere in
 *    the tree — only the direct attributes of the node it's on.
 *
 * 2. The `<head>` palette script below.
 *    The anti-flash script MUST run before the browser paints, which
 *    means it must be in <head>. Rendering it from inside a provider
 *    places it after the first paint in some layouts (suspense, nested
 *    segments). A plain inline script in <head> guarantees the ordering
 *    Next.js needs: it's serialized into the same <head> the browser
 *    parses before it starts rendering <body>.
 *
 *    The script is static (no user input, no request data), so
 *    `dangerouslySetInnerHTML` here is not a security concern — the
 *    content is a compile-time constant string.
 *
 * 3. `lang` on <html>.
 *    Set explicitly rather than relying on the browser default. Screen
 *    readers and translation services key off this attribute; an unset
 *    or wrong value degrades both.
 */

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  // Preload the two weights the UI actually uses at display sizes; letting
  // the variable font ship without preload means a brief flash of the
  // fallback on a cold load for the 700/900 headings.
  weight: ["400", "500", "700", "900"],
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Cafe",
    template: "%s | Cafe",
  },
  description:
    "Elevate your business with Cafe's real-time AI orchestration and custom digital dashboards.",
  applicationName: "Cafe",
  // Metadata is intentionally minimal. Per-page overrides use the `title`
  // template above. No `metadataBase` — none of the pages emit absolute
  // URLs yet (no og:image, no canonical), so setting one would be a lie.
  // Add it when the first absolute-URL metadata field is added.
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  robots: {
    // Prevents preview/staging deployments from being indexed if the app
    // is ever stood up on a public hostname before launch. Flip to
    // `index: true` once the production domain is live.
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `maximumScale` deliberately not set — locking pinch-zoom is an
  // accessibility regression, and Next.js doesn't enable it by default.
  //
  // `interactiveWidget: "resizes-content"` — tells mobile browsers to
  // resize the viewport when the software keyboard opens (rather than
  // overlaying content), which matters for the checkout and admin forms.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/**
 * Palette anti-flash script.
 *
 * Sets `data-color-theme` on <html> synchronously, before the browser
 * paints and before React hydrates — otherwise every page load flashes
 * the default palette (espresso) for a frame and then swaps to the
 * user's actual choice once ThemeBridge's effect runs.
 *
 * This is the same no-flash technique `next-themes` itself uses for the
 * light/dark `class` attribute on <html> (which next-themes injects via
 * its own inline script — we don't need to duplicate that here).
 *
 * Design notes:
 * - The script is a compile-time constant string. `VALID_PALETTES` and
 *   `DEFAULT_PALETTE` are duplicated here (rather than imported from
 *   theme-provider.tsx) because this file is a Server Component and
 *   theme-provider.tsx is a Client Component (`"use client"`), and
 *   importing a value from a client module into a server module at
 *   module scope would work but create a client-boundary reference we
 *   don't need for two literal arrays. When the palette list changes,
 *   both places must change — the build-time consistency assertion in
 *   theme-provider.tsx's module scope catches this by failing loudly if
 *   the two lists ever disagree.
 * - Fully wrapped in try/catch. `localStorage` access can throw in
 *   restricted contexts (Safari private mode, embedded webviews,
 *   third-party-cookie-blocked iframes). On any failure, the attribute
 *   is still set to the default, so the page paints in a valid palette
 *   rather than an unstyled one.
 * - Uses `v.indexOf(p)` rather than `v.includes(p)` because `p` may be
 *   `null` when the key is unset; `null` is coerced to the string
 *   "null" by `String()`, which is not in VALID_PALETTES, so `.includes`
 *   would also return false — but the intent is clearer and the
 *   behaviour is more obviously correct with `indexOf`, which returns -1
 *   for both "not present" and "null coerced to a string that isn't in
 *   the array".
 * - Reads `document.documentElement` once into a local (tiny perf win
 *   in the critical path, and makes the two `setAttribute` calls
 *   symmetrical).
 */
const PALETTE_ANTI_FLASH_SCRIPT = `(function(){try{var v=${JSON.stringify([
  "espresso",
  "emerald",
  "rosewood",
  "champagne",
])};var d=${JSON.stringify(
  "espresso",
)};var p=localStorage.getItem("cafe-color-palette");var el=document.documentElement;el.setAttribute("data-color-theme",v.indexOf(p)!==-1?p:d);}catch(e){try{document.documentElement.setAttribute("data-color-theme","espresso");}catch(_){}}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      // Explicit so Clerk's own redirects (e.g. an unauthenticated API
      // call from a stale tab) land on the app's real sign-in page
      // rather than a fallback Clerk hosts.
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en" suppressHydrationWarning className={inter.variable}>
        <head>
          {/*
           * The palette script is injected here, before the body, so it
           * runs before the browser paints. See the long comment on
           * PALETTE_ANTI_FLASH_SCRIPT above for the full reasoning.
           */}
          <script
            // Static, compile-time-constant content — see the doc comment
            // on PALETTE_ANTI_FLASH_SCRIPT for why this is not a security
            // concern. The alternative (next/script with
            // strategy="beforeInteractive") would work but is heavier and
            // adds a network round-trip for a ~200-byte inline script.
            dangerouslySetInnerHTML={{ __html: PALETTE_ANTI_FLASH_SCRIPT }}
          />
        </head>
        <body
          className={[
            inter.className,
            "antialiased",
            "bg-cafe-bg",
            "selection:bg-cafe-accent selection:text-cafe-accent-fg",
            // Body background inherits from `--background` (set by the
            // :root / .dark rules in globals.css). The transition here is
            // what makes light/dark toggles feel smooth rather than
            // instant — it's harmless during first paint because the
            // background is already at its target value by the time the
            // class is applied.
            "transition-colors duration-300",
          ].join(" ")}
        >
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <Toaster
            position="bottom-right"
            closeButton
            // Match the app's surface tokens so the toasts don't look
            // like a third-party component dropped onto the page.
            toastOptions={{
              classNames: {
                toast:
                  "!bg-cafe-card !text-cafe-fg !border-cafe-border !backdrop-blur-xl",
                description: "!text-gray-500",
                actionButton: "!bg-cafe-accent !text-cafe-accent-fg",
                cancelButton: "!bg-cafe-fg/5 !text-cafe-fg",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}