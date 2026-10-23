import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. It bypasses RLS: server-only, never import
 * it from a client component, and always authorize the caller first.
 *
 * Built once at module scope: with `persistSession: false` it holds no
 * per-request state.
 *
 * There is deliberately no anon-key fallback. A fallback would be a silent
 * downgrade: RLS would filter every privileged row to zero and admins would
 * be bounced with no diagnostic that looks different from "not an admin".
 * A missing env var must fail loudly instead.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Admin server code requires the " +
      "service-role key: the anon-key fallback has been removed.",
  );
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});
