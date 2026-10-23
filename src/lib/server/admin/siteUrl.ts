/** Public origin used for Stripe success/cancel redirects. */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  "http://localhost:3000";
