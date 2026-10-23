import type { SupabaseLikeError } from "../types";

const GENERIC_MESSAGE = "Failed to update the booking. Please try again.";

export function mapAdminUpdateError(
  error: SupabaseLikeError | null | undefined,
): string {
  if (!error) return GENERIC_MESSAGE;

  switch (error.code) {
    case "42501":
      return "You don't have permission to update this booking.";
    default:
      return error.message && error.message.length <= 160
        ? error.message
        : GENERIC_MESSAGE;
  }
}
