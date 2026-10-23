import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY.");

/**
 * Stripe client.
 *
 * The API version literal is pinned deliberately: Stripe changes the shape
 * of some webhook/response payloads between API versions, and a floating
 * default would change behaviour on a package upgrade without any code
 * change here. Bump it on purpose, and pair the bump with a review of every
 * place we read `.status`, `.amount`, `.object`, etc.
 *
 * `@ts-expect-error` is required because the Stripe SDK's local types track
 * the *latest* API version, but we pin to an earlier one that the rest of
 * the app's webhook handlers were written against.
 *
 * `maxNetworkRetries: 1` keeps the SDK from retrying on its own schedule:
 * callers have their own error handling, and a hidden retry would multiply
 * latency on a flaky Stripe without telling anybody.
 */
export const stripe = new Stripe(secretKey, {
  // @ts-expect-error pinned to a specific API version, not the SDK default
  apiVersion: "2024-12-18.acacia",
  maxNetworkRetries: 1,
});
