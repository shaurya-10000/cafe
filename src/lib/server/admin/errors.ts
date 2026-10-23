export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;

  return "Something went wrong.";
}

/**
 * Normalises a Postgres SQLSTATE off an arbitrary thrown value.
 *
 * The Supabase client puts the code on `.code`; Zod errors and raw network
 * errors have none; the Stripe SDK throws its own typed errors. This is the
 * single place that answers "what was the Postgres code, if any?".
 */
export function getPostgresCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;

  const code = (err as { code?: unknown }).code;

  return typeof code === "string" ? code : undefined;
}
