"use client";

import { useAiCartEvents } from "@/app/_home/hooks/useAiCartEvents";
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import CatalogGrid from "@/components/CatalogGrid";
import CartFAB from "@/components/CartFAB";
import OrderSidebar from "@/components/OrderSidebar";
import Footer from "@/components/Footer";
import LocationsSection from "@/components/LocationsSection";
import GamesAndRewards from "@/components/GamesAndRewards";
import ReviewsSection from "@/components/ReviewsSection";
import Hero from "@/components/Hero";
import BookingSection from "@/components/BookingsSection";
import { FAQAndAssistantSection } from "@/components/FAQAndAssistantSection";
import { useSupabaseClient } from "@/utils/supabase/client";
import { useApp } from "@/utils/providers/AppContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CartItem, CART_ITEM_MAX_QUANTITY } from "../types/cart";
import type { PendingPrefill } from "@/lib/ai/actions";

// Re-exported for any existing caller that imports CartItem from this page
// module directly — new code should import from "@/types/cart" instead.
export type { CartItem } from "../types/cart";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const FAVORITES_STORAGE_KEY = "cafe-favorites";
const CART_STORAGE_KEY = "cafe-cart";
const RESUME_ACTION_KEY = "cafe_resume_action";

/**
 * sessionStorage key for the cross-route prefill handshake written by
 * `lib/chat/actions.ts`'s `dispatchSectionAction`. Must stay in sync with
 * `PENDING_PREFILL_STORAGE_KEY` in that file.
 *
 * Declared here as a local literal rather than imported: importing a
 * *value* from `lib/chat/actions.ts` would pull the whole dispatcher
 * (Lucide icons, event constants, the entire switch) into the marketing
 * bundle for one 20-char string. Type-only imports from that file *are*
 * pulled in above because types are erased at compile time and cost
 * nothing at runtime.
 */
const PENDING_PREFILL_STORAGE_KEY = "cafe_pending_prefill";

// Event names shared with ChatWidget.tsx's EVENTS constant. Changing either
// side must change the other — nothing enforces this at the type level.
const EVENTS = {
  PREFILL_BOOKING: "cafe_prefill_booking",
  PREFILL_MENU: "cafe_prefill_menu",
  PREFILL_CHECKOUT: "cafe_prefill_checkout",
  OPEN_CART: "cafe_open_cart",
  OPEN_REWARD: "cafe_open_reward",
} as const;

/**
 * Section ids on this page. Mirrors `SECTION_IDS` in
 * `lib/chat/actions.ts`. The dispatcher uses these to decide whether the
 * target section is present on the *current* route; this file uses them
 * to resolve `?scrollTo=<id>` and to find the scroll target for stashed
 * prefill intents.
 */
const SECTION_IDS = {
  MENU: "menu",
  LOCATION: "location",
  BOOKINGS: "bookings",
  GAMES: "games-rewards",
  FAQ: "faq",
  CONTACT: "contact",
} as const;

/**
 * Default section for each stashed action type, used when the
 * sessionStorage stash is unavailable (private mode, quota, corrupt JSON)
 * but the URL param `?prefill=<actionType>` still tells us what the user
 * was trying to do. Kept outside the component so the fallback map isn't
 * rebuilt on every render of the consume-stash effect.
 */
const PREFILL_FALLBACK_SECTION: Record<string, string> = {
  PREFILL_RESERVATION: SECTION_IDS.BOOKINGS,
  ADD_TO_CART: SECTION_IDS.MENU,
  FILTER_MENU: SECTION_IDS.MENU,
  OPEN_REWARD: SECTION_IDS.GAMES,
  OPEN_DIRECTIONS: SECTION_IDS.LOCATION,
  OPEN_CONTACT: SECTION_IDS.CONTACT,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function safeReadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.error(`Failed to read "${key}" from localStorage:`, err);
    return fallback;
  }
}

function safeWriteJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Private browsing / storage quota / disabled storage — non-fatal.
    console.error(`Failed to write "${key}" to localStorage:`, err);
  }
}

/**
 * Scroll to an element by id, deferred by two animation frames.
 *
 * Why deferred: this helper is called from effects that fire right after
 * mount (following the sign-in redirect that led to this page, or after a
 * cross-route prefill stash is consumed). On the first paint, the browser
 * may not yet have resolved the Hero's `h-[100svh]` sizing — some engines
 * (notably iOS Safari) resolve `svh` units after their first layout pass.
 * Scrolling synchronously therefore computes the target's position against
 * stale metrics and lands short of the intended section.
 *
 * Two animation frames is the standard "after React commit AND after the
 * browser's own layout tick" deferral — same pattern used in
 * lib/chat/actions.ts's `deferScroll`.
 */
function scrollToSection(id: string): void {
  if (typeof window === "undefined") return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/**
 * Scroll to the footer specifically. The footer has no id (it's a
 * global, not a numbered section), so this can't go through
 * `scrollToSection`. Shared by three call sites (stashed OPEN_CONTACT,
 * URL fallback for OPEN_CONTACT, URL scrollTo=contact) so the two-rAF
 * deferral lives in one place.
 */
function scrollToFooter(): void {
  if (typeof document === "undefined") return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document
        .querySelector("footer")
        ?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/**
 * Apply a stashed cross-route prefill intent by firing the same cafe
 * event `dispatchChatAction` would have fired if the section had been
 * present on the previous route.
 *
 * This is the mirror of `dispatchSectionAction` in `lib/chat/actions.ts`:
 * that function decides "navigate home and stash" when the section is
 * missing; this function consumes the stash on arrival.
 *
 * The switch handles exactly the subset of actions that
 * `dispatchSectionAction` can stash. Every other action type either
 * (a) doesn't go through the stash path (router.push direct, e.g.
 * VIEW_ORDERS), or (b) can't reach the stash path (admin actions target
 * /admin, not /). If the dispatcher ever grows a new stashed action, the
 * `default` branch below is a safe no-op — the user lands on the home
 * page, the event that would have fired doesn't, and nothing breaks;
 * the fix is one `case` here.
 *
 * The scroll is performed *before* the event dispatch so the receiving
 * component is at least in view when it starts applying its prefill; the
 * order doesn't strictly matter since both target the same section, but
 * scrolling first avoids a "why did the page jump" flash on slower
 * devices.
 */
function applyPendingPrefill(prefill: PendingPrefill): void {
  if (typeof window === "undefined") return;

  const { actionType, data, sectionId } = prefill;

  switch (actionType) {
    case "PREFILL_RESERVATION": {
      scrollToSection(SECTION_IDS.BOOKINGS);
      if (data) {
        window.dispatchEvent(
          new CustomEvent(EVENTS.PREFILL_BOOKING, { detail: data }),
        );
      }
      break;
    }

    case "ADD_TO_CART": {
      scrollToSection(SECTION_IDS.MENU);

      // The stash payload for ADD_TO_CART is always
      // `{ itemsToAdd: [...] }` because `dispatchSectionAction` in
      // `lib/chat/actions.ts` normalizes single-item shorthand into the
      // array before stashing. Defensive read keeps a malformed stash
      // from crashing the listener.
      const payload = data as { itemsToAdd?: unknown } | undefined;
      if (payload && Array.isArray(payload.itemsToAdd)) {
        window.dispatchEvent(
          new CustomEvent(EVENTS.PREFILL_MENU, {
            detail: { itemsToAdd: payload.itemsToAdd },
          }),
        );
      }
      break;
    }

    case "FILTER_MENU": {
      scrollToSection(SECTION_IDS.MENU);
      const payload = data as
        | { category?: unknown; search?: unknown; maxPrice?: unknown }
        | undefined;
      if (payload) {
        window.dispatchEvent(
          new CustomEvent(EVENTS.PREFILL_MENU, {
            detail: {
              category: payload.category,
              search: payload.search,
              maxPrice: payload.maxPrice,
            },
          }),
        );
      }
      break;
    }

    case "OPEN_REWARD": {
      scrollToSection(SECTION_IDS.GAMES);
      window.dispatchEvent(new CustomEvent(EVENTS.OPEN_REWARD));
      break;
    }

    case "OPEN_DIRECTIONS": {
      scrollToSection(SECTION_IDS.LOCATION);
      break;
    }

    case "OPEN_CONTACT": {
      // Footer has no id; the dispatcher stashes sectionId="contact" for
      // this case, and we translate that into a footer query here.
      scrollToFooter();
      break;
    }

    case "NAVIGATE_SECTION": {
      // Plain scroll; `sectionId` carries the target.
      if (sectionId === SECTION_IDS.CONTACT) {
        scrollToFooter();
      } else if (sectionId) {
        scrollToSection(sectionId);
      }
      break;
    }

    case "START_CHECKOUT": {
      // No section target — the sidebar opens via the AppContext, and
      // OrderSidebar picks up the prefill from its own listener.
      if (data) {
        window.dispatchEvent(
          new CustomEvent(EVENTS.PREFILL_CHECKOUT, { detail: data }),
        );
      }
      break;
    }

    default:
      // Unknown action type — safe no-op. See the doc comment above.
      break;
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

function HomeContent() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [, setCurrency] = useState("USD");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  // Header (rendered once, globally, by ClientLayoutWrapper) reads cart
  // state from AppContext, so its cart icon works no matter what page
  // you're on. This page owns the *actual* cart (the one rendered in
  // OrderSidebar below) and is responsible for keeping AppContext's
  // cartCount in sync with it — see the effect near totalItemsCount.
  const { isCartOpen, setCartOpen, setCartCount } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  // A ref to the timeout so the auto-dismiss can be cancelled if a new
  // warning replaces the previous one before the first timer fires.
  // Without this, two warnings back-to-back leave the first timer alive;
  // it fires 6s after the *first* warning was set and clears the second
  // warning early, because both timers call the same `setSyncWarning(null)`.
  const syncWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const flashSyncWarning = useCallback((message: string) => {
    setSyncWarning(message);
    if (syncWarningTimerRef.current !== null) {
      clearTimeout(syncWarningTimerRef.current);
    }
    syncWarningTimerRef.current = setTimeout(() => {
      syncWarningTimerRef.current = null;
      setSyncWarning(null);
    }, 6000);
  }, []);

  // Clean up any in-flight timer on unmount so it can't fire into a
  // component that's already gone (a StrictMode double-mount would
  // otherwise leave a stale timer alive on the first instance).
  useEffect(() => {
    return () => {
      if (syncWarningTimerRef.current !== null) {
        clearTimeout(syncWarningTimerRef.current);
        syncWarningTimerRef.current = null;
      }
    };
  }, []);

  const dismissSyncWarning = useCallback(() => {
    if (syncWarningTimerRef.current !== null) {
      clearTimeout(syncWarningTimerRef.current);
      syncWarningTimerRef.current = null;
    }
    setSyncWarning(null);
  }, []);

  /* ---- Cart loader (shared by hydration + post-merge reload) ------------ */

  // Fetches the signed-in user's cart from Supabase, joined against
  // catalog_items_public (a second query by item id; cart_items.item_id = catalog_items.id) for display
  // name/price. Takes `currencyForFormatting` as an explicit argument
  // rather than reading the `currency` state closure — during initial
  // hydration this runs before setCurrency's update has landed, and a
  // stale closure here would silently format everything as USD.
  const loadCartFromSupabase = useCallback(
    async (currencyForFormatting: string): Promise<CartItem[] | null> => {
      if (!user) return null;

      const { data: cartData, error: cartError } = await supabase
        .from("cart_items")
        .select("quantity, item_id")
        .eq("user_id", user.id);

      if (cartError) {
        console.error("Failed to load cart from Supabase:", {
          message: cartError.message,
          code: cartError.code,
          details: cartError.details,
        });
        return null;
      }

      if (!cartData || cartData.length === 0) {
        return [];
      }

      const itemIds = cartData.map((c) => c.item_id);

      const { data: catalogData, error: catalogError } = await supabase
        .from("catalog_items_public")
        .select("id, name, numeric_price")
        .in("id", itemIds);

      if (catalogError) {
        console.error("Failed to load catalog for cart:", {
          message: catalogError.message,
          code: catalogError.code,
        });
        return null;
      }

      const catalogMap = new Map(catalogData?.map((item) => [item.id, item]) || []);

      const data = cartData.flatMap((cartRow) => {
        const item = catalogMap.get(cartRow.item_id);
        if (!item) return []; // Item was deleted or deactivated; silently drop it from the display
        
        return [{
          item_id: cartRow.item_id,
          quantity: cartRow.quantity,
          name: item.name,
          numeric_price: item.numeric_price
        }];
      });

      let formatter: Intl.NumberFormat;
      try {
        formatter = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currencyForFormatting,
        });
      } catch {
        // business_settings.currency is only length-checked at the DB
        // layer, not validated against ISO 4217. A garbage value here
        // shouldn't crash the cart loader.
        formatter = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        });
      }

      return data.map((row) => ({
        id: row.item_id as string,
        name: row.name as string,
        numeric_price: row.numeric_price as number,
        price: formatter.format(row.numeric_price as number),
        quantity: row.quantity as number,
      }));
    },
    [supabase, user],
  );

  /* ---- Initial Data Hydration ------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    const hydrateData = async () => {
      // Only guests read favorites from localStorage. A signed-in user's
      // favorites come from Supabase (via CatalogGrid's own fetch), and
      // reading the local copy here would both (a) show another account's
      // favorites for a frame, and (b) race CatalogGrid's fetch —
      // whichever resolved last would win, non-deterministically.
      if (!user) {
        const savedFavs = safeReadJSON<string[]>(FAVORITES_STORAGE_KEY, []);
        if (!cancelled) setFavoriteIds(savedFavs);
      }

      const { data: settingsData } = await supabase
        .from("business_settings")
        .select("currency")
        .eq("id", true)
        .maybeSingle();
      const resolvedCurrency = settingsData?.currency || "USD";
      if (!cancelled) setCurrency(resolvedCurrency);

      if (user) {
        // Merge-on-login: a guest may have added items to the localStorage
        // cart before signing in. Without this, that cart is silently
        // discarded the moment `user` becomes truthy, since the branch
        // below only reads from Supabase. Merge by quantity (capped at
        // CART_ITEM_MAX_QUANTITY, matching the DB CHECK constraint, so the
        // merge upsert can't fail on an item that was heavily stocked on
        // both sides), persist the merged result, then clear the guest
        // cart so it isn't re-merged on a future login.
        const guestCart = safeReadJSON<CartItem[]>(CART_STORAGE_KEY, []);

        if (guestCart.length > 0) {
          try {
            // Prune first: a guest cart can contain item_ids that no
            // longer exist in catalog_items (item was hard-deleted, or
            // the catalog was reseeded with new uuids since the guest
            // added it). The cart_items.item_id FK would reject the whole
            // merge upsert if even one stale id is present — 23503, "Key
            // is not present in table catalog_items" — which would
            // silently drop the whole guest cart instead of merging the
            // valid items.
            const guestItemIds = Array.from(
              new Set(guestCart.map((i) => i.id)),
            );
            const { data: validRows, error: validErr } = await supabase
              .from("catalog_items_public")
              .select("id")
              .in("id", guestItemIds);

            if (validErr) throw validErr;

            const validIds = new Set(
              (validRows ?? []).map((r: { id: string }) => r.id),
            );
            const validGuestCart = guestCart.filter((i) => validIds.has(i.id));

            if (validGuestCart.length > 0) {
              const existing = await loadCartFromSupabase(resolvedCurrency);
              const merged = new Map<string, number>();

              (existing || []).forEach((item) =>
                merged.set(item.id, item.quantity),
              );
              validGuestCart.forEach((item) => {
                const combined = (merged.get(item.id) || 0) + item.quantity;
                merged.set(
                  item.id,
                  Math.min(combined, CART_ITEM_MAX_QUANTITY),
                );
              });

              const rows = Array.from(merged.entries()).map(
                ([item_id, quantity]) => ({
                  user_id: user.id,
                  item_id,
                  quantity,
                }),
              );

              if (rows.length > 0) {
                const { error: mergeError } = await supabase
                  .from("cart_items")
                  .upsert(rows, { onConflict: "user_id,item_id" });
                if (mergeError) throw mergeError;
              }
            }

            // Clear the guest cart regardless of how many items survived
            // — keeping it around after a partial merge just means the
            // stale entries get re-pruned on every future sign-in.
            localStorage.removeItem(CART_STORAGE_KEY);
          } catch (err) {
            console.error("Failed to merge guest cart on login:", err);
            if (!cancelled) {
              flashSyncWarning(
                "We couldn't merge your cart from before you signed in.",
              );
            }
          }
        }

        const supabaseItems = await loadCartFromSupabase(resolvedCurrency);
        if (!cancelled && supabaseItems) {
          setCartItems(supabaseItems);
        }
      } else {
        const savedCart = safeReadJSON<CartItem[]>(CART_STORAGE_KEY, []);
        if (!cancelled) setCartItems(savedCart);
      }

      if (!cancelled) setMounted(true);
    };

    hydrateData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user]);

  /* ---- Persist to LocalStorage whenever state changes ------------------- */
  //
  // Both the cart and favorites are only locally persisted for GUESTS.
  // For signed-in users, Supabase is the source of truth — writing their
  // favorites to localStorage too means:
  //   - a shared browser keeps user A's favorites after A signs out and
  //     user B signs in, which is a privacy leak between accounts
  //   - CatalogGrid's optimistic favorite toggle writes into `favoriteIds`
  //     state that has no legitimate local persistence anymore
  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      safeWriteJSON(FAVORITES_STORAGE_KEY, favoriteIds);
      safeWriteJSON(CART_STORAGE_KEY, cartItems);
    }
  }, [favoriteIds, cartItems, mounted, user]);

  /* ---- Resume a gated AI action after sign-in --------------------------- */
  //
  // ChatWidget stashes the original intent in sessionStorage right before
  // redirecting to /sign-in; this picks it back up. The event names and
  // scroll targets must stay in sync with ChatWidget's EVENTS / SECTION_IDS
  // constants and with BookingSection's PREFILL_EVENT_NAME.
  //
  // The `scrollToSection` helper above defers each scroll by two animation
  // frames — synchronous scrollIntoView on this effect's mount tick lands
  // short of the target because the Hero's `svh`-unit height isn't yet
  // resolved. See that helper's doc comment for the full reasoning.
  useEffect(() => {
    if (!mounted) return;

    try {
      const raw = sessionStorage.getItem(RESUME_ACTION_KEY);
      if (!raw) return;
      sessionStorage.removeItem(RESUME_ACTION_KEY);

      // The payload shape depends on `type` and is re-validated by whichever
      // listener consumes it, so it is intentionally untyped here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resume = JSON.parse(raw) as { type: string; data?: any };
      if (!resume?.type) return;

      switch (resume.type) {
        case "PREFILL_RESERVATION": {
          scrollToSection(SECTION_IDS.BOOKINGS);
          if (resume.data) {
            window.dispatchEvent(
              new CustomEvent(EVENTS.PREFILL_BOOKING, {
                detail: resume.data,
              }),
            );
          }
          break;
        }

        case "ADD_TO_CART": {
          scrollToSection(SECTION_IDS.MENU);
          // Normalize single-item shape into the items array so the
          // CatalogGrid listener only handles one form.
          const itemToAdd = resume.data?.items?.length
            ? resume.data.items
            : resume.data?.itemId
              ? [
                  {
                    itemId: resume.data.itemId,
                    itemName: resume.data.itemName,
                    quantity: resume.data.quantity || 1,
                  },
                ]
              : [];
          if (itemToAdd.length > 0) {
            window.dispatchEvent(
              new CustomEvent(EVENTS.PREFILL_MENU, {
                detail: { itemsToAdd: itemToAdd },
              }),
            );
          }
          break;
        }

        case "FILTER_MENU": {
          scrollToSection(SECTION_IDS.MENU);
          window.dispatchEvent(
            new CustomEvent(EVENTS.PREFILL_MENU, {
              detail: {
                category: resume.data?.category,
                search: resume.data?.search,
              },
            }),
          );
          break;
        }

        case "START_CHECKOUT": {
          // Prefill checkout contact details, then open the sidebar.
          // OrderSidebar's prefill listener handles the config; the
          // OPEN_CART event opens the sidebar itself.
          if (resume.data) {
            window.dispatchEvent(
              new CustomEvent(EVENTS.PREFILL_CHECKOUT, {
                detail: resume.data,
              }),
            );
          }
          setCartOpen(true);
          break;
        }

        case "VIEW_ORDERS": {
          router.push(
            `/customer?tab=${resume.data?.tab === "history" ? "history" : "active"}`,
          );
          break;
        }

        case "VIEW_RESERVATIONS": {
          router.push("/customer?tab=bookings");
          break;
        }

        case "VIEW_FAVORITES": {
          router.push("/customer?tab=favorites");
          break;
        }

        default: {
          // Unknown resume type — nothing safe to do. The original
          // dispatch already happened in ChatWidget; the resume is a
          // best-effort replay of the intent post-sign-in.
          break;
        }
      }
    } catch (err) {
      console.error("Resume action error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  /* ---- Consume cross-route prefill stash -------------------------------- */
  //
  // When the user is on a non-home route and the AI emits an action whose
  // target section only exists here, `dispatchSectionAction` in
  // `lib/chat/actions.ts` navigates to `/?prefill=<actionType>` (or
  // `/?scrollTo=<sectionId>`) and stashes the payload in sessionStorage.
  // This effect picks that up on mount.
  //
  // Runs after `mounted` is true so the child sections below have actually
  // rendered their DOM nodes — the stash's scroll targets depend on this.
  //
  // Ordering relative to the sign-in resume effect above: they target
  // different sessionStorage keys and different action types in practice,
  // so running one before the other is safe. If both somehow fire in the
  // same tick (sign-in resume + pending prefill), the scrolls are both
  // deferred by two animation frames and land in a stable order —
  // whichever effect runs last wins the final scroll position, and both
  // payloads are applied to their respective components because they
  // dispatch to different events.
  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;

    // ── 1. Stashed prefill from a cross-route navigation ───────────────
    let hadStash = false;
    try {
      const raw = window.sessionStorage.getItem(PENDING_PREFILL_STORAGE_KEY);
      if (raw) {
        window.sessionStorage.removeItem(PENDING_PREFILL_STORAGE_KEY);
        const parsed = JSON.parse(raw) as PendingPrefill;
        if (parsed && typeof parsed.actionType === "string") {
          applyPendingPrefill(parsed);
          hadStash = true;
        }
      }
    } catch (err) {
      // Corrupt stash — treat as absent.
      console.error("[Home] Failed to read pending prefill:", err);
    }

    // ── 2. URL params — signal, cleared after use ──────────────────────
    //
    // `?prefill=<actionType>` / `?scrollTo=<sectionId>` are the URL half
    // of the handshake. The dispatcher always writes *both* the URL
    // param and the sessionStorage stash, so the URL param is normally
    // redundant with the stash. It becomes load-bearing only if the
    // sessionStorage write failed (private mode, quota) — in that case
    // the param still tells us which section to scroll to, even though
    // the payload is lost.
    const prefillParam = searchParams.get("prefill");
    const scrollToParam = searchParams.get("scrollTo");

    if (!hadStash && prefillParam) {
      // Stash was unavailable, but we at least know what the user was
      // trying to do. Scroll to the default section for that action.
      const fallbackId = PREFILL_FALLBACK_SECTION[prefillParam];
      if (fallbackId === SECTION_IDS.CONTACT) {
        scrollToFooter();
      } else if (fallbackId) {
        scrollToSection(fallbackId);
      }
    } else if (!hadStash && scrollToParam) {
      // Pure scroll — no payload to apply.
      if (scrollToParam === SECTION_IDS.CONTACT) {
        scrollToFooter();
      } else {
        scrollToSection(scrollToParam);
      }
    }

    // Clear the URL params so a manual refresh doesn't re-fire the
    // scroll. Preserve any other query params the user might have
    // (openCart, etc.) — this page only ever reads them individually.
    if (prefillParam || scrollToParam) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("prefill");
      nextParams.delete("scrollTo");
      const next = nextParams.toString();
      router.replace(next ? `/?${next}` : "/", { scroll: false });
    }
  }, [mounted, searchParams, router]);

  /* ---- ?openCart=1 → open cart once landed ----------------------------- */

  useEffect(() => {
    if (!mounted) return;
    if (searchParams.get("openCart") === "1") {
      setCartOpen(true);
      router.replace("/", { scroll: false });
    }
  }, [mounted, searchParams, setCartOpen, router]);

  /* ---- External event listeners (AI concierge) -------------------------- */

  // ChatWidget dispatches this for cart mutations (remove / update /
  // clear) that land in OrderSidebar. The order sidebar doesn't own
  // `isCartOpen` — that state lives here. So the listener here just opens
  // the sidebar; the OrderSidebar picks up the actual mutation request
  // through its own dedicated listeners (added in the OrderSidebar step).
  useEffect(() => {
    if (!mounted) return;

    const handleOpenCart = (event: Event) => {
      // Remove / update / clear arrive on this same event. useAiCartEvents
      // performs them and decides whether the sidebar opens.
      const detail = (event as CustomEvent<{ type?: unknown }>).detail;
      if (typeof detail?.type === "string") return;
      setCartOpen(true);
    };

    window.addEventListener(EVENTS.OPEN_CART, handleOpenCart);

    return () => {
      window.removeEventListener(EVENTS.OPEN_CART, handleOpenCart);
    };
  }, [mounted, setCartOpen]);

  /* ---- Header cart badge sync ------------------------------------------- */

  const totalItemsCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  useEffect(() => {
    if (!mounted) return;
    setCartCount(totalItemsCount);
  }, [mounted, totalItemsCount, setCartCount]);

  /* ---- Scroll helpers --------------------------------------------------- */
  //
  // These are the Hero's own buttons (Explore Menu / Find Us). They're
  // ref-based, not getElementById, and they fire from a direct user click
  // — not routed through ChatWidget's dispatcher — so they don't hit the
  // timing bug the dispatcher had (close-widget → scroll in the same
  // tick). The Hero sits at the top of the page and its own buttons
  // scroll forward from where the user already is, so a synchronous
  // scrollIntoView is correct here.
  const scrollToMenu = useCallback(() => {
    menuRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToLocation = useCallback(() => {
    locationRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ---- Cart mutations --------------------------------------------------- */

  // Accepts a real quantity (defaults to 1 for normal clicks) and computes
  // the resulting quantity from the functional state updater itself, rather
  // than reading the outer `cartItems` closure — that closure could be
  // stale if this fires twice in quick succession (e.g. the AI adding
  // several distinct items back-to-back).
  //
  // The functional updater also captures `previousItems`, the exact array
  // React had before this call — not a value recomputed after the fact —
  // so if the Supabase write below fails, we can restore precisely what
  // was on screen.
  const addToCart = useCallback(
    async (newItem: Omit<CartItem, "quantity">, quantity: number = 1) => {
      let previousItems: CartItem[] = [];
      let resultingQuantity = quantity;
      let wasClamped = false;
      let noChange = false;

      setCartItems((prev) => {
        previousItems = prev;
        const existingItem = prev.find((item) => item.id === newItem.id);
        const previousQuantity = existingItem?.quantity ?? 0;
        const rawQuantity = previousQuantity + quantity;

        resultingQuantity = Math.min(rawQuantity, CART_ITEM_MAX_QUANTITY);
        wasClamped = rawQuantity > CART_ITEM_MAX_QUANTITY;

        if (resultingQuantity === previousQuantity) {
          noChange = true;
          return prev;
        }

        if (existingItem) {
          return prev.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: resultingQuantity }
              : item,
          );
        }
        return [...prev, { ...newItem, quantity: resultingQuantity }];
      });

      if (wasClamped) {
        flashSyncWarning(
          `You can have up to ${CART_ITEM_MAX_QUANTITY} of "${newItem.name}" in your cart.`,
        );
      }

      if (noChange || !user) return;

      const { error } = await supabase
        .from("cart_items")
        .upsert(
          {
            user_id: user.id,
            item_id: newItem.id,
            quantity: resultingQuantity,
          },
          { onConflict: "user_id,item_id" },
        );

      if (error) {
        console.error("Failed to sync added item to Supabase:", error);
        setCartItems(previousItems);
        flashSyncWarning(
          `"${newItem.name}" couldn't be saved to your account, so we've undone it locally too.`,
        );
      }
    },
    [supabase, user, flashSyncWarning],
  );

  const removeOne = useCallback(
    async (id: string) => {
      let previousItems: CartItem[] = [];
      let shouldDelete = false;
      let resultingQuantity = 0;
      let found = false;

      setCartItems((prev) => {
        previousItems = prev;
        const existingItem = prev.find((item) => item.id === id);
        if (!existingItem) return prev;
        found = true;

        if (existingItem.quantity > 1) {
          resultingQuantity = existingItem.quantity - 1;
          return prev.map((item) =>
            item.id === id ? { ...item, quantity: resultingQuantity } : item,
          );
        }
        shouldDelete = true;
        return prev.filter((item) => item.id !== id);
      });

      if (!found || !user) return;

      // Note: each branch's `.error` here already *is* the error value
      // (PostgrestError | null) — don't destructure `{ error }` off of it.
      const error = shouldDelete
        ? (
            await supabase
              .from("cart_items")
              .delete()
              .eq("user_id", user.id)
              .eq("item_id", id)
          ).error
        : (
            await supabase
              .from("cart_items")
              .update({ quantity: resultingQuantity })
              .eq("user_id", user.id)
              .eq("item_id", id)
          ).error;

      if (error) {
        console.error("Failed to sync removed item to Supabase:", error);
        setCartItems(previousItems);
        flashSyncWarning(
          "That change couldn't be saved to your account, so we've undone it locally too.",
        );
      }
    },
    [supabase, user, flashSyncWarning],
  );

  const removeAllOfItem = useCallback(
    async (id: string) => {
      let previousItems: CartItem[] = [];
      let found = false;

      setCartItems((prev) => {
        previousItems = prev;
        found = prev.some((item) => item.id === id);
        return prev.filter((item) => item.id !== id);
      });

      if (!found || !user) return;

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", id);

      if (error) {
        console.error("Failed to remove item from Supabase:", error);
        setCartItems(previousItems);
        flashSyncWarning(
          "That item couldn't be removed from your account, so we've restored it locally too.",
        );
      }
    },
    [supabase, user, flashSyncWarning],
  );

  const setItemQuantity = useCallback(
    async (id: string, quantity: number, previousQuantity: number) => {
      const target = Math.min(
        CART_ITEM_MAX_QUANTITY,
        Math.max(1, Math.trunc(quantity)),
      );

      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: target } : item,
        ),
      );

      if (!user) return;

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: target })
        .eq("user_id", user.id)
        .eq("item_id", id);

      if (error) {
        console.error("Failed to sync quantity change to Supabase:", error);
        // Restore just this line rather than a snapshot of the whole cart.
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, quantity: previousQuantity } : item,
          ),
        );
        flashSyncWarning(
          "That change couldn't be saved to your account, so we've undone it locally too.",
        );
      }
    },
    [supabase, user, flashSyncWarning],
  );

  const clearCart = useCallback(async () => {
    let previousItems: CartItem[] = [];

    setCartItems((prev) => {
      previousItems = prev;
      return [];
    });
    setCartOpen(false);

    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      if (error) {
        console.error("Failed to clear cart in Supabase:", error);
        setCartItems(previousItems);
        flashSyncWarning(
          "Your cart couldn't be cleared on our end, so we've restored it locally.",
        );
        return;
      }
    }

    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear cart from localStorage:", err);
    }
  }, [supabase, user, setCartOpen, flashSyncWarning]);

  // AI concierge: remove / update / clear requests arrive as OPEN_CART events.
  useAiCartEvents({
    items: cartItems,
    onRemoveAll: removeAllOfItem,
    onSetQuantity: setItemQuantity,
    onClear: clearCart,
    openCart: () => setCartOpen(true),
  });

  /* ---- Render ----------------------------------------------------------- */

  if (!mounted) return null;

  return (
    <div className="w-full min-h-screen bg-cafe-bg transition-colors duration-300 overflow-x-hidden">
      {syncWarning && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-red-500 px-5 py-3 text-xs font-bold text-white shadow-2xl"
        >
          {syncWarning}
          <button
            onClick={dismissSyncWarning}
            aria-label="Dismiss"
            className="opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            ✕
          </button>
        </div>
      )}

      <Hero
        scrollToMenu={scrollToMenu}
        scrollToLocation={scrollToLocation}
        onOpenAi={() => setIsAiOpen(true)}
      />

      <div className="w-full">
        <div ref={menuRef} id="menu" className="scroll-mt-24">
          <CatalogGrid
            onAddItem={addToCart}
            favoriteIds={favoriteIds}
            setFavoriteIds={setFavoriteIds}
          />
        </div>

        <div ref={locationRef} id="location" className="scroll-mt-24">
          <LocationsSection />
        </div>

        {/* BookingSection owns id="bookings" itself — a wrapper with the
            same id here would duplicate it in the DOM. */}
        <div className="scroll-mt-24">
          <BookingSection />
        </div>

        {/* GamesAndRewards owns id="games-rewards" itself. The wrapper div
            only adds scroll offset; it intentionally does NOT set the id,
            because that would duplicate the section's own id in the DOM
            (React does not deduplicate ids). */}
        <div className="scroll-mt-24">
          <GamesAndRewards
            isAuthenticated={!!user}
            onSignUpClick={() => router.push("/sign-in")}
          />
        </div>

        <ReviewsSection />

        <div id="faq" className="scroll-mt-24">
          <FAQAndAssistantSection
            isAiOpen={isAiOpen}
            setIsAiOpen={setIsAiOpen}
          />
        </div>
      </div>

      <Footer />

      <CartFAB count={totalItemsCount} onClick={() => setCartOpen(true)} />

      <OrderSidebar
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onRemoveOne={removeOne}
        onRemoveAll={removeAllOfItem}
        onClear={clearCart}
        favoriteIds={favoriteIds}
        onAddItem={addToCart}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}