/**
 * Discriminated result shape every location action returns.
 *
 * The default `T = object` is load-bearing and not `Record<string, never>`:
 * with `Record<string, never>`, TS treats every property on the success
 * branch as constrained by that index signature, so even a bare
 * `{ success: true }` fails to type-check against
 * `{ success: true } & Record<string, never>`: its own `success: true`
 * property gets checked against the index signature's `never` type.
 * `object` carries no index signature, so it imposes no extra constraint
 * while still requiring any explicit T (e.g. `ActionResult<{ id: string }>`)
 * to be satisfied in full.
 */
export type ActionResult<T = object> =
  | ({ success: true } & T)
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };
